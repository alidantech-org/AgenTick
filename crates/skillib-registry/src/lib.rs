//! Registry contracts, secure token storage, and HTTP transport.

mod client;
mod http;
mod models;
mod token;

pub use client::RegistryClient;
pub use http::HttpRegistryClient;
pub use models::{Identity, PackageSummary, PublishRequest, PublishResult, RegistryIndex, ResolvedRelease};
pub use token::TokenStore;

/// Registry failures normalized for CLI and LSP consumers.
#[derive(Debug, thiserror::Error)]
pub enum RegistryError {
    #[error(transparent)]
    Http(#[from] reqwest::Error),
    #[error(transparent)]
    Url(#[from] url::ParseError),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
    #[error("registry returned {status}: {message}")]
    Response {
        status: reqwest::StatusCode,
        message: String,
    },
    #[error("invalid token storage path")]
    InvalidTokenPath,
}
