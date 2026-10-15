//! Native (tray / app menu) labels. Frontend strings live in src/shared/i18n.

use crate::app::state::AppState;
use crate::domain::settings::{self, LocalePref};
use tauri::{AppHandle, Manager};

pub struct Labels {
    pub open: &'static str,
    pub settings: &'static str,
    pub settings_menu: &'static str,
    pub check_update: &'static str,
    pub restart_update: &'static str,
    pub quit: &'static str,
}

/// Same rule as the frontend `resolveLocale`: "system" follows the OS language.
pub fn resolve(pref: LocalePref) -> &'static str {
    match pref {
        LocalePref::Ko => "ko",
        LocalePref::En => "en",
        LocalePref::System if sys_locale::get_locale().is_some_and(|l| l.to_lowercase().starts_with("ko")) => "ko",
        LocalePref::System => "en",
    }
}

pub fn labels(locale: &str) -> Labels {
    if locale == "ko" {
        Labels {
            open: "열기",
            settings: "설정",
            settings_menu: "설정…",
            check_update: "업데이트 확인",
            restart_update: "업데이트 후 재시작",
            quit: "종료",
        }
    } else {
        Labels {
            open: "Open",
            settings: "Settings",
            settings_menu: "Settings…",
            check_update: "Check for Updates",
            restart_update: "Restart to Update",
            quit: "Quit",
        }
    }
}

/// Labels for the stored locale preference.
pub fn current(app: &AppHandle) -> Labels {
    let pref = app
        .try_state::<AppState>()
        .and_then(|state| settings::locale(&state.db.lock().unwrap()).ok())
        .unwrap_or(LocalePref::System);
    labels(resolve(pref))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::settings::LocalePref;

    #[test]
    fn explicit_pref_wins_over_os() {
        assert_eq!(resolve(LocalePref::Ko), "ko");
        assert_eq!(resolve(LocalePref::En), "en");
    }

    #[test]
    fn korean_labels() {
        assert_eq!(labels("ko").settings, "설정");
        assert_eq!(labels("en").settings, "Settings");
        assert_eq!(labels("xx").quit, "Quit");
    }
}
