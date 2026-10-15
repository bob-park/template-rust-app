//! macOS app menu: the default menu plus i18n::current(app).settings_menu (Cmd+,) in the app submenu.
//! Windows has no app menu; Ctrl+, is handled by the frontend (`open_settings` command).

use crate::app::{i18n, window};
use tauri::menu::{Menu, MenuEvent, MenuItem, MenuItemKind};
use tauri::{AppHandle, Wry};

pub fn build(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let menu = Menu::default(app)?;
    if let Some(MenuItemKind::Submenu(app_menu)) = menu.items()?.first() {
        let settings = MenuItem::with_id(app, "settings", i18n::current(app).settings_menu, true, Some("CmdOrCtrl+,"))?;
        // After "About" and its separator.
        app_menu.insert(&settings, 2)?;
    }
    Ok(menu)
}

pub fn on_event(app: &AppHandle, event: MenuEvent) {
    if event.id().as_ref() == "settings" {
        window::show_settings(app);
    }
}

/// Rebuilds the app menu, e.g. after the language changed. No-op off macOS.
pub fn refresh(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    if let Ok(menu) = build(app) {
        let _ = app.set_menu(menu);
    }
    #[cfg(not(target_os = "macos"))]
    let _ = app;
}
