//! Main window lifecycle: built after state is managed, hidden on close, reopened from Dock/tray.

use tauri::{App, AppHandle, Emitter, Manager, Window, WindowEvent};

pub const MAIN: &str = "main";
pub const SETTINGS: &str = "settings";

/// Windows are `create: false` in tauri.conf.json so no webview can call a command
/// before `AppState` is managed. Call this at the end of `setup`.
pub fn build_all(app: &App) -> tauri::Result<()> {
    for config in app.config().app.windows.clone() {
        tauri::WebviewWindowBuilder::from_config(app.handle(), &config)?.build()?;
    }
    Ok(())
}

pub fn show_main(app: &AppHandle) {
    show(app, MAIN);
}

pub fn show_settings(app: &AppHandle) {
    // Hidden, not destroyed, on close; tell the page to start over on the general tab.
    let _ = app.emit_to(SETTINGS, "settings://opened", ());
    show(app, SETTINGS);
}

fn show(app: &AppHandle, label: &str) {
    if let Some(window) = app.get_webview_window(label) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Closing a window hides it; the app keeps running in the tray.
pub fn hide_on_close(window: &Window, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
    }
}

#[tauri::command]
pub fn open_settings(app: AppHandle) {
    show_settings(&app);
}
