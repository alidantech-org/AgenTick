//! Deterministic Skillib package archives, cache, and lockfiles.

mod archive;
mod cache;
mod lockfile;

pub use archive::PackageArchive;
pub use cache::PackageCache;
pub use lockfile::{LockedPackage, Lockfile};

#[derive(Debug, thiserror::Error)]
pub enum PackageError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
    #[error("package integrity verification failed")]
    IntegrityMismatch,
}
