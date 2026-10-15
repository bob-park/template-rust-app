//! Thin Tauri adapters over the settings domain API.

use super::Theme;
use crate::app::state::AppState;
use crate::shared::error::AppResult;
use tauri::{AppHandle, Emitter, State};

pub const THEME_CHANGED: &str = "settings://theme-changed";

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
