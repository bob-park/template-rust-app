//! Settings domain: app-wide key/value preferences. Public API for other code.

pub mod commands;
mod model;
pub mod repository;

pub use model::Theme;

use crate::shared::error::{AppError, AppResult};
use rusqlite::Connection;

const DEFAULT_GREETING: &str = "Hello, world";

pub fn greeting(conn: &Connection) -> AppResult<String> {
    Ok(repository::get(conn, "greeting")?.unwrap_or_else(|| DEFAULT_GREETING.into()))
}

/// A missing or unknown stored value means the user never picked one: follow the OS.
pub fn theme(conn: &Connection) -> AppResult<Theme> {
    Ok(repository::get(conn, "theme")?.as_deref().and_then(Theme::parse).unwrap_or(Theme::System))
}

pub fn set_theme(conn: &Connection, raw: &str) -> AppResult<Theme> {
    let theme = Theme::parse(raw).ok_or_else(|| AppError::InvalidInput(format!("unknown theme: {raw}")))?;
    repository::set(conn, "theme", theme.as_str())?;
    Ok(theme)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::shared::{db, error::AppError};

    #[test]
    fn seeds_defaults() {
        let conn = db::open_in_memory().unwrap();
        assert_eq!(greeting(&conn).unwrap(), "Hello, world");
        assert_eq!(theme(&conn).unwrap(), Theme::System);
    }

    #[test]
    fn theme_falls_back_to_system_for_unknown_value() {
        let conn = db::open_in_memory().unwrap();
        repository::set(&conn, "theme", "blue").unwrap();
        assert_eq!(theme(&conn).unwrap(), Theme::System);
    }

    #[test]
    fn set_theme_rejects_unknown_value() {
        let conn = db::open_in_memory().unwrap();
        assert!(matches!(set_theme(&conn, "blue"), Err(AppError::InvalidInput(_))));
        assert_eq!(repository::get(&conn, "theme").unwrap().as_deref(), Some("system"));
    }

    #[test]
    fn set_theme_round_trips() {
        let conn = db::open_in_memory().unwrap();
        assert_eq!(set_theme(&conn, "dark").unwrap(), Theme::Dark);
        assert_eq!(theme(&conn).unwrap(), Theme::Dark);
    }
}
