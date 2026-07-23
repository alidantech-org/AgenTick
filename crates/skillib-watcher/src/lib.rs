//! Recursive filesystem watcher and structured Skillib events.

use chrono::{DateTime, Utc};
use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use skillib_compiler::{Compiler, SkillCompiler};
use skillib_source::{SourceFile, is_skillib_path};
use std::path::{Path, PathBuf};
use tokio::sync::mpsc;

/// Structured watcher event persisted and rendered by the CLI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchEvent {
    /// Event timestamp.
    pub timestamp: DateTime<Utc>,
    /// Stable event type.
    pub kind: String,
    /// Project-relative path when available.
    pub path: Option<PathBuf>,
    /// Short display message.
    pub message: String,
}

/// Active watcher handle. Keeping this value alive keeps the OS watcher alive.
pub struct WatchSession {
    _watcher: RecommendedWatcher,
    /// Receives normalized events.
    pub events: mpsc::Receiver<WatchEvent>,
}

/// Starts a recursive watcher rooted at `root`.
pub fn watch(root: &Path) -> notify::Result<WatchSession> {
    let (sender, receiver) = mpsc::channel(256);
    let project_root = root.to_path_buf();
    let mut watcher = notify::recommended_watcher(move |result: notify::Result<notify::Event>| {
        let Ok(event) = result else { return };
        for path in event.paths {
            let sender = sender.clone();
            let root = project_root.clone();
            let kind = event_kind(&event.kind).to_owned();
            tokio::spawn(async move {
                let relative = path.strip_prefix(&root).unwrap_or(&path).to_path_buf();
                let mut message = kind.clone();
                let mut event_type = format!("file.{kind}");
                if is_skillib_path(&path) && path.is_file() {
                    if let Ok(text) = std::fs::read_to_string(&path)
                        && let Ok(source) = SourceFile::new(path.clone(), text)
                    {
                        let result = SkillCompiler.compile(&source);
                        event_type = if result.success { "skill.valid" } else { "skill.invalid" }.into();
                        message = format!("{} diagnostic(s)", result.diagnostics.len());
                    }
                }
                let _ = sender.send(WatchEvent {
                    timestamp: Utc::now(),
                    kind: event_type,
                    path: Some(relative),
                    message,
                }).await;
            });
        }
    })?;
    watcher.watch(root, RecursiveMode::Recursive)?;
    Ok(WatchSession { _watcher: watcher, events: receiver })
}

fn event_kind(kind: &EventKind) -> &'static str {
    match kind {
        EventKind::Create(_) => "created",
        EventKind::Modify(_) => "changed",
        EventKind::Remove(_) => "removed",
        EventKind::Access(_) => "accessed",
        EventKind::Other | EventKind::Any => "observed",
    }
}
