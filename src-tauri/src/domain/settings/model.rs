use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

impl Theme {
    pub fn parse(s: &str) -> Option<Theme> {
        match s {
            "light" => Some(Theme::Light),
            "dark" => Some(Theme::Dark),
            "system" => Some(Theme::System),
            _ => None,
        }
    }

    pub fn as_str(self) -> &'static str {
        match self {
            Theme::Light => "light",
            Theme::Dark => "dark",
            Theme::System => "system",
        }
    }
}

/// UI language preference. `System` follows the OS language.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LocalePref {
    System,
    En,
    Ko,
}

impl LocalePref {
    pub fn parse(s: &str) -> Option<LocalePref> {
        match s {
            "system" => Some(LocalePref::System),
            "en" => Some(LocalePref::En),
            "ko" => Some(LocalePref::Ko),
            _ => None,
        }
    }

    pub fn as_str(self) -> &'static str {
        match self {
            LocalePref::System => "system",
            LocalePref::En => "en",
            LocalePref::Ko => "ko",
        }
    }
}
