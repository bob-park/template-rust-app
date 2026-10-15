mod app;
mod domain;
mod shared;

use app::state::AppState;
use domain::settings;
use std::sync::Mutex;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        // Must be first: a second launch focuses the existing window.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| app::window::show_main(app)))
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // ponytail: a DB open failure aborts setup; add an error dialog (tauri-plugin-dialog,
            // as in vee-app) once real user data is at stake.
            let conn = shared::db::open(&app.path().app_data_dir()?.join("app.db"))?;
            app.manage(AppState { db: Mutex::new(conn) });
            app::window::build_all(app)?;
            Ok(())
        })
        .on_window_event(app::window::hide_on_close)
        .invoke_handler(tauri::generate_handler![
            settings::commands::get_greeting,
            settings::commands::get_theme,
            settings::commands::set_theme,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, _event| {
            // Dock icon click with no visible window.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { has_visible_windows: false, .. } = _event {
                app::window::show_main(_app);
            }
        });
}
