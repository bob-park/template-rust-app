//! Menu-bar / system-tray icon.

use crate::app::{i18n, updater, window};
use tauri::menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, Wry};

const TRAY_ID: &str = "main";

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let l = i18n::current(app);
    let ready = app.state::<updater::UpdateState>().ready_version().is_some();
    Menu::with_items(
        app,
        &[
            &MenuItem::with_id(app, "open", l.open, true, None::<&str>)?,
            &MenuItem::with_id(app, "settings", l.settings, true, None::<&str>)?,
            &MenuItem::with_id(app, "update", if ready { l.restart_update } else { l.check_update }, true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "quit", l.quit, true, None::<&str>)?,
        ],
    )
}

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    // macOS tints a black template glyph to match the menu bar; Windows keeps the colour icon.
    #[cfg(target_os = "macos")]
    let (icon, template) = (tauri::image::Image::from_bytes(include_bytes!("../../icons/tray.png"))?, true);
    #[cfg(not(target_os = "macos"))]
    let (icon, template) = (app.default_window_icon().cloned().expect("bundle has an icon"), false);
    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .icon_as_template(template)
        .menu(&build_menu(app)?)
        .on_menu_event(on_menu_event)
        .build(app)?;
    Ok(())
}

/// Rebuilds the menu so it reflects the current update status and language.
pub fn refresh(app: &AppHandle) {
    let (Some(tray), Ok(menu)) = (app.tray_by_id(TRAY_ID), build_menu(app)) else { return };
    let _ = tray.set_menu(Some(menu));
}

fn on_menu_event(app: &AppHandle, event: MenuEvent) {
    match event.id().as_ref() {
        "open" => window::show_main(app),
        "settings" => window::show_settings(app),
        "update" if app.state::<updater::UpdateState>().ready_version().is_some() => {
            if let Err(e) = updater::install_and_restart(app) {
                log::error!("update install failed: {e}");
            }
        }
        "update" => {
            let app = app.clone();
            tauri::async_runtime::spawn(async move { updater::check(&app).await });
        }
        "quit" => app.exit(0),
        _ => {}
    }
}
