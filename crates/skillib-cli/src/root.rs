use anyhow::Result;
use std::path::{Path, PathBuf};

pub fn discover(start: &Path) -> Result<PathBuf> {
    let start = start.canonicalize()?;
    for candidate in start.ancestors() {
        if candidate.join(".git").exists() {
            return Ok(candidate.to_path_buf());
        }
    }
    Ok(start)
}
