//! The single error type returned by commands. Serialized as `{ code, message }`.

use serde::{Serialize, Serializer, ser::SerializeStruct};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("invalid input: {0}")]
    InvalidInput(String),
    #[error("database error: {0}")]
    Db(#[from] rusqlite::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    /// The DB was written by a newer app version (e.g. an older build reinstalled over it).
    #[error("database schema v{found} is newer than this app supports (v{supported})")]
    SchemaTooNew { found: i64, supported: i64 },
}

impl AppError {
    pub fn code(&self) -> &'static str {
        match self {
            AppError::InvalidInput(_) => "INVALID_INPUT",
            AppError::Db(_) => "DB",
            AppError::Io(_) => "IO",
            AppError::SchemaTooNew { .. } => "SCHEMA_TOO_NEW",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let mut st = s.serialize_struct("AppError", 2)?;
        st.serialize_field("code", self.code())?;
        st.serialize_field("message", &self.to_string())?;
        st.end()
    }
}

pub type AppResult<T> = Result<T, AppError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_code_and_message() {
        let json = serde_json::to_value(AppError::InvalidInput("x".into())).unwrap();
        assert_eq!(json["code"], "INVALID_INPUT");
        assert_eq!(json["message"], "invalid input: x");
    }
}
