use crate::{Identity, PackageSummary, PublishRequest, PublishResult, RegistryError, RegistryIndex, ResolvedRelease};
use async_trait::async_trait;

/// Replaceable registry boundary used by CLI, runtime, and LSP.
#[async_trait]
pub trait RegistryClient: Send + Sync {
    async fn identity(&self, token: &str) -> Result<Identity, RegistryError>;
    async fn search(&self, query: &str) -> Result<Vec<PackageSummary>, RegistryError>;
    async fn index(&self, revision: Option<u64>) -> Result<RegistryIndex, RegistryError>;
    async fn resolve(
        &self,
        package: &str,
        selector: &str,
        token: Option<&str>,
    ) -> Result<ResolvedRelease, RegistryError>;
    async fn download(
        &self,
        release: &ResolvedRelease,
        token: Option<&str>,
    ) -> Result<Vec<u8>, RegistryError>;
    async fn publish(
        &self,
        request: &PublishRequest,
        token: &str,
    ) -> Result<PublishResult, RegistryError>;
}
