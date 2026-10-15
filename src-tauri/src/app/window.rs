//! Main window lifecycle: built after state is managed, hidden on close, reopened from Dock/tray.

use crate::app::i18n;
use tauri::{App, AppHandle, Emitter, Manager, Window, WindowEvent};

pub const MAIN: &str = "main";
pub const SETTINGS: &str = "settings";

/// Tells the settings page to start over on its first tab.
pub const SETTINGS_OPENED: &str = "settings://opened";

/// Windows are `create: false` in tauri.conf.json so no webview can call a command
/// before `AppState` is managed. Call this at the end of `setup`.
pub fn build_all(app: &App) -> tauri::Result<()> {
    for config in app.config().app.windows.clone() {
        tauri::WebviewWindowBuilder::from_config(app.handle(), &config)?.build()?;
    }
    refresh_titles(app.handle());
    Ok(())
}

/// Native window titles follow the stored language. The main window keeps the product name.
pub fn refresh_titles(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(SETTINGS) {
        let _ = window.set_title(i18n::current(app).settings);
    }
}

pub fn show_main(app: &AppHandle) {
    show(app, MAIN);
}

pub fn show_settings(app: &AppHandle) {
    // Hidden, not destroyed, on close; tell the page to start over on the general tab.
    let _ = app.emit_to(SETTINGS, SETTINGS_OPENED, ());
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
