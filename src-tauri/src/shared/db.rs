//! Opens the SQLite database and applies migrations tracked by `PRAGMA user_version`.

use crate::shared::error::AppResult;
use rusqlite::Connection;
use std::path::Path;

/// One entry per schema version, applied in order. Never edit a shipped entry; append a new file.
const MIGRATIONS: &[&str] = &[include_str!("migrations/0001_init.sql")];

pub fn open(path: &Path) -> AppResult<Connection> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let mut conn = Connection::open(path)?;
    migrate(&mut conn)?;
    Ok(conn)
}

pub fn open_in_memory() -> AppResult<Connection> {
    let mut conn = Connection::open_in_memory()?;
    migrate(&mut conn)?;
    Ok(conn)
}

fn migrate(conn: &mut Connection) -> AppResult<()> {
    let current: i64 = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    for (i, sql) in MIGRATIONS.iter().enumerate().skip(current as usize) {
        let tx = conn.transaction()?;
        tx.execute_batch(sql)?;
        tx.pragma_update(None, "user_version", (i + 1) as i64)?;
        tx.commit()?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::settings::repository;

    #[test]
    fn open_creates_missing_parent_dirs() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a/b/app.db");
        open(&path).unwrap();
        assert!(path.exists());
    }

    #[test]
    fn reopen_keeps_user_values() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("app.db");
        repository::set(&open(&path).unwrap(), "greeting", "Hi").unwrap();

        let conn = open(&path).unwrap();
        assert_eq!(repository::get(&conn, "greeting").unwrap().as_deref(), Some("Hi"));
        let version: i64 = conn.query_row("PRAGMA user_version", [], |r| r.get(0)).unwrap();
        assert_eq!(version, MIGRATIONS.len() as i64);
    }
}
