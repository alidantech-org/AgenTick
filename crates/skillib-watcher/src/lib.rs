//! Recursive terminal watcher with structured append-only history.

mod config;
mod engine;
mod event;
mod history;

pub use config::WatchConfig;
pub use engine::{WatchSession, watch};
pub use event::WatchEvent;
pub use history::HistoryStore;
