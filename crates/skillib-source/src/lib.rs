//! Source files, locations, and supported Skillib extensions.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// A byte range inside a source file.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Span {
    /// Inclusive start byte.
    pub start: usize,
    /// Exclusive end byte.
    pub end: usize,
}

impl Span {
    /// Creates a new source span.
    #[must_use]
    pub const fn new(start: usize, end: usize) -> Self {
        Self { start, end }
    }
}

/// An in-memory Skillib source document.
#[derive(Debug, Clone)]
pub struct SourceFile {
    path: PathBuf,
    text: String,
}

impl SourceFile {
    /// Creates a source file after validating its extension.
    ///
    /// # Errors
    ///
    /// Returns [`SourceError::UnsupportedExtension`] when the path does not end
    /// in `.sl` or `.skillib`.
    pub fn new(path: impl Into<PathBuf>, text: impl Into<String>) -> Result<Self, SourceError> {
        let path = path.into();
        if !is_skillib_path(&path) {
            return Err(SourceError::UnsupportedExtension(path));
        }
        Ok(Self {
            path,
            text: text.into(),
        })
    }

    /// Returns the source path.
    #[must_use]
    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Returns the UTF-8 source text.
    #[must_use]
    pub fn text(&self) -> &str {
        &self.text
    }
}

/// Returns true for `.sl` and `.skillib` files.
#[must_use]
pub fn is_skillib_path(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|value| value.to_str()),
        Some("sl" | "skillib")
    )
}

/// Source loading failures.
#[derive(Debug, thiserror::Error)]
pub enum SourceError {
    /// The path does not use a supported extension.
    #[error("Skillib sources must use .sl or .skillib: {0}")]
    UnsupportedExtension(PathBuf),
}
