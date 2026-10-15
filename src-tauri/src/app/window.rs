//! Main window lifecycle: built after state is managed, hidden on close, reopened from Dock/tray.

use tauri::{App, AppHandle, Manager, Window, WindowEvent};

pub const MAIN: &str = "main";

/// Windows are `create: false` in tauri.conf.json so no webview can call a command
/// before `AppState` is managed. Call this at the end of `setup`.
pub fn build_all(app: &App) -> tauri::Result<()> {
    for config in app.config().app.windows.clone() {
        tauri::WebviewWindowBuilder::from_config(app.handle(), &config)?.build()?;
    }
    Ok(())
}

pub fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Closing the main window hides it; the app keeps running in the tray.
pub fn hide_on_close(window: &Window, event: &WindowEvent) {
    if let (MAIN, WindowEvent::CloseRequested { api, .. }) = (window.label(), event) {
        api.prevent_close();
        let _ = window.hide();
    }
}
