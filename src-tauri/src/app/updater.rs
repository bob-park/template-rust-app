//! Checks GitHub Releases, downloads in the background, installs only when asked from the tray.

use crate::app::{state::AppState, tray};
use crate::domain::settings;
use serde::Serialize;
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_updater::{Update, UpdaterExt};

const CHECK_EVERY: Duration = Duration::from_secs(6 * 60 * 60);

pub const UPDATE_STATUS: &str = "update://status";

#[derive(Clone, Debug, Default, PartialEq, Serialize)]
#[serde(tag = "status", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum UpdateStatus {
    #[default]
    Idle,
    Checking,
    UpToDate { checked_at: i64 },
    Ready { version: String },
    Failed { checked_at: i64 },
}

#[derive(Default)]
pub struct UpdateState {
    status: Mutex<UpdateStatus>,
    pending: Mutex<Option<(Update, Vec<u8>)>>,
}

impl UpdateState {
    pub fn ready_version(&self) -> Option<String> {
        match &*self.status.lock().unwrap() {
            UpdateStatus::Ready { version } => Some(version.clone()),
            _ => None,
        }
    }
}

fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

fn set_status(app: &AppHandle, status: UpdateStatus) {
    *app.state::<UpdateState>().status.lock().unwrap() = status.clone();
    let _ = app.emit(UPDATE_STATUS, status);
    tray::refresh(app);
}

async fn fetch(app: &AppHandle) -> tauri_plugin_updater::Result<Option<(Update, Vec<u8>)>> {
    let Some(update) = app.updater()?.check().await? else { return Ok(None) };
    let bytes = update.download(|_, _| {}, || {}).await?;
    Ok(Some((update, bytes)))
}

/// Claims the status for a new check under one lock. Returns the current status instead when a
/// check is already running or an update is ready, so concurrent callers never download twice.
fn begin_check(status: &Mutex<UpdateStatus>) -> Option<UpdateStatus> {
    let mut status = status.lock().unwrap();
    if matches!(*status, UpdateStatus::Ready { .. } | UpdateStatus::Checking) {
        return Some(status.clone());
    }
    *status = UpdateStatus::Checking;
    None
}

pub async fn check(app: &AppHandle) -> UpdateStatus {
    if let Some(current) = begin_check(&app.state::<UpdateState>().status) {
        return current;
    }
    set_status(app, UpdateStatus::Checking);
    let status = match fetch(app).await {
        Ok(Some((update, bytes))) => {
            let version = update.version.clone();
            *app.state::<UpdateState>().pending.lock().unwrap() = Some((update, bytes));
            UpdateStatus::Ready { version }
        }
        Ok(None) => UpdateStatus::UpToDate { checked_at: now_ms() },
        Err(e) => {
            log::warn!("update check failed: {e}");
            UpdateStatus::Failed { checked_at: now_ms() }
        }
    };
    set_status(app, status.clone());
    status
}

pub fn install_and_restart(app: &AppHandle) -> Result<(), String> {
    // Borrow, don't take: a failed install keeps the download so the user can retry.
    let state = app.state::<UpdateState>();
    let pending = state.pending.lock().unwrap();
    let Some((update, bytes)) = pending.as_ref() else { return Err("no update has been downloaded".into()) };
    update.install(bytes).map_err(|e| e.to_string())?;
    drop(pending);
    app.restart();
}

/// Checks at startup and every 6 hours while auto-update is on. Skipped in debug builds.
pub fn spawn_periodic(app: AppHandle) {
    if cfg!(debug_assertions) {
        return;
    }
    std::thread::spawn(move || loop {
        let enabled = settings::auto_update(&app.state::<AppState>().db.lock().unwrap()).unwrap_or(true);
        if enabled {
            tauri::async_runtime::block_on(check(&app));
        }
        std::thread::sleep(CHECK_EVERY);
    });
}

#[tauri::command]
pub async fn check_update(app: AppHandle) -> UpdateStatus {
    check(&app).await
}

#[tauri::command]
pub fn get_update_status(state: State<UpdateState>) -> UpdateStatus {
    state.status.lock().unwrap().clone()
}

#[tauri::command]
pub fn install_update_and_restart(app: AppHandle) -> Result<(), String> {
    install_and_restart(&app)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn begin_check_claims_the_status_once() {
        let status = Mutex::new(UpdateStatus::Idle);
        assert_eq!(begin_check(&status), None);
        assert_eq!(*status.lock().unwrap(), UpdateStatus::Checking);
        // A second caller (tray click while the periodic check runs) must not start another download.
        assert_eq!(begin_check(&status), Some(UpdateStatus::Checking));
    }

    #[test]
    fn begin_check_keeps_a_ready_update() {
        let status = Mutex::new(UpdateStatus::Ready { version: "0.2.0".into() });
        assert_eq!(begin_check(&status), Some(UpdateStatus::Ready { version: "0.2.0".into() }));
    }

    #[test]
    fn status_serializes_like_the_typescript_union() {
        let json = |s: UpdateStatus| serde_json::to_value(s).unwrap();
        assert_eq!(json(UpdateStatus::Idle), serde_json::json!({ "status": "idle" }));
        assert_eq!(
            json(UpdateStatus::UpToDate { checked_at: 5 }),
            serde_json::json!({ "status": "upToDate", "checkedAt": 5 })
        );
        assert_eq!(
            json(UpdateStatus::Ready { version: "0.2.0".into() }),
            serde_json::json!({ "status": "ready", "version": "0.2.0" })
        );
    }
}
