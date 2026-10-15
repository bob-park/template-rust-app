//! Thin Tauri adapters over the settings domain API.

use super::{LocalePref, Theme};
use crate::app::state::AppState;
use crate::shared::error::AppResult;
use tauri::{AppHandle, Emitter, State};

pub const THEME_CHANGED: &str = "settings://theme-changed";
pub const LOCALE_CHANGED: &str = "settings://locale-changed";

#[tauri::command]
pub fn get_greeting(state: State<AppState>) -> AppResult<String> {
    super::greeting(&state.db.lock().unwrap())
}

#[tauri::command]
pub fn get_theme(state: State<AppState>) -> AppResult<Theme> {
    super::theme(&state.db.lock().unwrap())
}

/// Every window keeps its own frontend state, so tell all of them.
#[tauri::command]
pub fn set_theme(app: AppHandle, state: State<AppState>, theme: String) -> AppResult<Theme> {
    let theme = super::set_theme(&state.db.lock().unwrap(), &theme)?;
    let _ = app.emit(THEME_CHANGED, theme);
    Ok(theme)
}

#[tauri::command]
pub fn get_auto_update(state: State<AppState>) -> AppResult<bool> {
    super::auto_update(&state.db.lock().unwrap())
}

#[tauri::command]
pub fn set_auto_update(state: State<AppState>, enabled: bool) -> AppResult<bool> {
    super::set_auto_update(&state.db.lock().unwrap(), enabled)
}

#[tauri::command]
pub fn get_locale(state: State<AppState>) -> AppResult<LocalePref> {
    super::locale(&state.db.lock().unwrap())
}

/// Also relabels the native tray and app menu.
#[tauri::command]
pub fn set_locale(app: AppHandle, state: State<AppState>, locale: String) -> AppResult<LocalePref> {
    let locale = super::set_locale(&state.db.lock().unwrap(), &locale)?;
    crate::app::tray::refresh(&app);
    crate::app::menu::refresh(&app);
    crate::app::window::refresh_titles(&app);
    let _ = app.emit(LOCALE_CHANGED, locale);
    Ok(locale)
}
