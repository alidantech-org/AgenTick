//! Registry contracts and HTTP transport for the Next.js control plane.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use url::Url;

/// Registry identity returned for an authenticated token.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Identity {
    /// Account handle.
    pub handle: String,
    /// Granted scopes.
    pub scopes: Vec<String>,
}

/// Minimal package search result used by CLI and LSP completion.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageSummary {
    /// Registry package id.
    pub id: String,
    /// Human-readable description.
    pub description: String,
    /// Latest release label.
    pub latest: String,
}

/// Replaceable registry boundary.
#[async_trait]
pub trait RegistryClient: Send + Sync {
    /// Resolves the active token identity.
    async fn identity(&self, token: &str) -> Result<Identity, RegistryError>;
    /// Searches package metadata.
    async fn search(&self, query: &str) -> Result<Vec<PackageSummary>, RegistryError>;
}

/// HTTP implementation backed by the Next.js API.
#[derive(Clone)]
pub struct HttpRegistryClient {
    base_url: Url,
    client: reqwest::Client,
}

impl HttpRegistryClient {
    /// Creates an HTTP registry client.
    #[must_use]
    pub fn new(base_url: Url) -> Self {
        Self { base_url, client: reqwest::Client::new() }
    }

    fn endpoint(&self, path: &str) -> Result<Url, RegistryError> {
        self.base_url.join(path).map_err(RegistryError::Url)
    }
}

#[async_trait]
impl RegistryClient for HttpRegistryClient {
    async fn identity(&self, token: &str) -> Result<Identity, RegistryError> {
        let response = self.client
            .get(self.endpoint("api/v1/auth/me")?)
            .bearer_auth(token)
            .send().await?
            .error_for_status()?;
        Ok(response.json().await?)
    }

    async fn search(&self, query: &str) -> Result<Vec<PackageSummary>, RegistryError> {
        let response = self.client
            .get(self.endpoint("api/v1/skills/search")?)
            .query(&[("q", query)])
            .send().await?
            .error_for_status()?;
        Ok(response.json().await?)
    }
}

/// Registry transport failures.
#[derive(Debug, thiserror::Error)]
pub enum RegistryError {
    /// HTTP transport or response failure.
    #[error(transparent)]
    Http(#[from] reqwest::Error),
    /// Invalid endpoint construction.
    #[error(transparent)]
    Url(#[from] url::ParseError),
}
