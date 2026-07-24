use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchEvent {
    pub session_id: String,
    pub timestamp: DateTime<Utc>,
    pub kind: String,
    pub path: Option<PathBuf>,
    pub message: String,
    #[serde(default)]
    pub data: serde_json::Value,
}

impl WatchEvent {
    #[must_use]
    pub fn new(session_id: &str, kind: impl Into<String>, path: Option<PathBuf>, message: impl Into<String>) -> Self {
        Self {
            session_id: session_id.to_owned(),
            timestamp: Utc::now(),
            kind: kind.into(),
            path,
            message: message.into(),
            data: serde_json::Value::Null,
        }
    }
}
