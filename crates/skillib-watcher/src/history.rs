use crate::WatchEvent;
use std::{
    fs::OpenOptions,
    io::Write,
    path::{Path, PathBuf},
};

pub struct HistoryStore {
    path: PathBuf,
}

impl HistoryStore {
    #[must_use]
    pub fn project(root: &Path) -> Self {
        Self {
            path: root.join("agents/.skillib/events.jsonl"),
        }
    }

    /// Appends one structured watcher event.
    ///
    /// # Errors
    ///
    /// Returns an I/O error when the history directory or file cannot be
    /// created, written, or serialized.
    pub fn append(&self, event: &WatchEvent) -> Result<(), std::io::Error> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.path)?;
        serde_json::to_writer(&mut file, event).map_err(std::io::Error::other)?;
        file.write_all(b"\n")?;
        Ok(())
    }

    /// Reads the most recent history records.
    ///
    /// # Errors
    ///
    /// Returns an I/O error when the JSONL history file cannot be read.
    pub fn recent(&self, limit: usize) -> Result<Vec<WatchEvent>, std::io::Error> {
        if !self.path.exists() {
            return Ok(Vec::new());
        }
        let text = std::fs::read_to_string(&self.path)?;
        let mut events: Vec<_> = text
            .lines()
            .filter_map(|line| serde_json::from_str(line).ok())
            .collect();
        let start = events.len().saturating_sub(limit);
        Ok(events.split_off(start))
    }
}
