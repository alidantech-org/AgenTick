use serde::{Deserialize, Serialize};

/// Registry identity returned for an authenticated token.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Identity {
    pub handle: String,
    pub email: Option<String>,
    pub scopes: Vec<String>,
}

/// Search result shared by CLI and LSP.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageSummary {
    pub id: String,
    pub description: String,
    pub latest: String,
    #[serde(default)]
    pub tags: Vec<String>,
}

/// Immutable release metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolvedRelease {
    pub package: String,
    pub release: u64,
    pub version: String,
    pub integrity: String,
    pub download_url: String,
}

/// Publish request sent to the control plane.
#[derive(Debug, Clone, Serialize)]
pub struct PublishRequest {
    pub package: String,
    pub source: String,
    pub extension: String,
    pub ir: serde_json::Value,
    pub source_hash: String,
    pub ir_hash: String,
    pub compiler_version: String,
    pub visibility: String,
}

/// Publish response returned by the registry.
#[derive(Debug, Clone, Deserialize)]
pub struct PublishResult {
    pub package: String,
    pub release: u64,
    pub version: String,
    pub integrity: String,
}

/// Cached registry index used for completion.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryIndex {
    pub revision: u64,
    #[serde(default)]
    pub packages: Vec<PackageSummary>,
}
