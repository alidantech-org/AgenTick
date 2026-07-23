use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchConfig {
    #[serde(default = "default_ignores")]
    pub ignores: Vec<String>,
    #[serde(default = "default_protected")]
    pub protected: Vec<String>,
    #[serde(default = "default_debounce_ms")]
    pub debounce_ms: u64,
}

impl Default for WatchConfig {
    fn default() -> Self {
        Self {
            ignores: default_ignores(),
            protected: default_protected(),
            debounce_ms: default_debounce_ms(),
        }
    }
}

impl WatchConfig {
    pub fn load(root: &Path) -> Self {
        let path = root.join("agents/skillib-watch.json");
        std::fs::read(path)
            .ok()
            .and_then(|bytes| serde_json::from_slice(&bytes).ok())
            .unwrap_or_default()
    }

    #[must_use]
    pub fn ignored(&self, path: &Path) -> bool {
        let value = path.to_string_lossy().replace('\\', "/");
        self.ignores.iter().any(|pattern| value.contains(pattern))
    }

    #[must_use]
    pub fn protected(&self, path: &Path) -> bool {
        let value = path.to_string_lossy().replace('\\', "/");
        self.protected.iter().any(|prefix| value.starts_with(prefix))
    }
}

fn default_ignores() -> Vec<String> {
    ["/.git/", "/node_modules/", "/target/", "/.next/", "/dist/", "/agents/.skillib/"]
        .into_iter().map(str::to_owned).collect()
}

fn default_protected() -> Vec<String> {
    ["agents/rules/", "agents/architecture/", "agents/templates/"]
        .into_iter().map(str::to_owned).collect()
}

const fn default_debounce_ms() -> u64 { 120 }
