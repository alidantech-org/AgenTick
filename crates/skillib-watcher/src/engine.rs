use crate::{HistoryStore, WatchConfig, WatchEvent};
use chrono::Utc;
use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use skillib_compiler::{Compiler, SkillCompiler};
use skillib_source::{SourceFile, is_skillib_path};
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tokio::sync::mpsc;

pub struct WatchSession {
    _watcher: RecommendedWatcher,
    pub events: mpsc::Receiver<WatchEvent>,
    pub session_id: String,
}

/// Starts a recursive project watcher.
///
/// # Errors
///
/// Returns a notify error when the operating-system watcher cannot be created
/// or the project root cannot be registered.
pub fn watch(root: &Path) -> notify::Result<WatchSession> {
    let config = WatchConfig::load(root);
    let history = Arc::new(HistoryStore::project(root));
    let seen = Arc::new(Mutex::new(HashMap::<PathBuf, Instant>::new()));
    let session_id = Utc::now()
        .timestamp_nanos_opt()
        .unwrap_or_default()
        .to_string();
    let (sender, receiver) = mpsc::channel(256);
    let project_root = root.to_path_buf();
    let callback_session = session_id.clone();
    let mut watcher = notify::recommended_watcher(move |result: notify::Result<notify::Event>| {
        let Ok(event) = result else { return };
        for path in event.paths {
            let relative = path
                .strip_prefix(&project_root)
                .unwrap_or(&path)
                .to_path_buf();
            if config.ignored(&relative) || debounced(&seen, &relative, config.debounce_ms) {
                continue;
            }
            let sender = sender.clone();
            let history = Arc::clone(&history);
            let session = callback_session.clone();
            let protected = config.protected(&relative);
            let kind = classify(event.kind, protected);
            tokio::spawn(async move {
                let watch_event = build_event(&session, kind, relative, &path);
                let _ = history.append(&watch_event);
                let _ = sender.send(watch_event).await;
            });
        }
    })?;
    watcher.watch(root, RecursiveMode::Recursive)?;
    Ok(WatchSession {
        _watcher: watcher,
        events: receiver,
        session_id,
    })
}

fn debounced(seen: &Mutex<HashMap<PathBuf, Instant>>, path: &Path, delay: u64) -> bool {
    let mut values = seen
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let now = Instant::now();
    let duplicate = values
        .get(path)
        .is_some_and(|last| now.duration_since(*last) < Duration::from_millis(delay));
    values.insert(path.to_path_buf(), now);
    duplicate
}

fn classify(kind: EventKind, protected: bool) -> String {
    if protected {
        return "protected_file.changed".into();
    }
    match kind {
        EventKind::Create(_) => "file.created",
        EventKind::Modify(_) => "file.changed",
        EventKind::Remove(_) => "file.removed",
        EventKind::Access(_) => "file.accessed",
        EventKind::Other | EventKind::Any => "file.observed",
    }
    .into()
}

fn build_event(session: &str, kind: String, relative: PathBuf, absolute: &Path) -> WatchEvent {
    if is_skillib_path(absolute)
        && absolute.is_file()
        && let Ok(text) = std::fs::read_to_string(absolute)
        && let Ok(source) = SourceFile::new(absolute.to_path_buf(), text)
    {
        let result = SkillCompiler.compile(&source);
        let skill_kind = if result.success {
            "skill.valid"
        } else {
            "skill.invalid"
        };
        let mut event = WatchEvent::new(
            session,
            skill_kind,
            Some(relative),
            format!("{} diagnostic(s)", result.diagnostics.len()),
        );
        event.data = serde_json::json!({
            "diagnostics": result.diagnostics,
            "irHash": result.ir_hash,
        });
        return event;
    }
    WatchEvent::new(session, kind.clone(), Some(relative), kind)
}
