use crate::{Identity, PackageSummary, PublishRequest, PublishResult, RegistryClient, RegistryError, RegistryIndex, ResolvedRelease};
use async_trait::async_trait;
use reqwest::{RequestBuilder, StatusCode};
use url::Url;

#[derive(Clone)]
pub struct HttpRegistryClient {
    base_url: Url,
    client: reqwest::Client,
}

impl HttpRegistryClient {
    #[must_use]
    pub fn new(base_url: Url) -> Self {
        Self { base_url, client: reqwest::Client::new() }
    }

    fn endpoint(&self, path: &str) -> Result<Url, RegistryError> {
        self.base_url.join(path).map_err(RegistryError::Url)
    }

    fn authorize(builder: RequestBuilder, token: Option<&str>) -> RequestBuilder {
        token.map_or(builder, |value| builder.bearer_auth(value))
    }

    async fn checked(response: reqwest::Response) -> Result<reqwest::Response, RegistryError> {
        let status = response.status();
        if status.is_success() {
            return Ok(response);
        }
        let message = response.text().await.unwrap_or_default();
        Err(RegistryError::Response { status, message })
    }
}

#[async_trait]
impl RegistryClient for HttpRegistryClient {
    async fn identity(&self, token: &str) -> Result<Identity, RegistryError> {
        let response = self.client.get(self.endpoint("api/v1/auth/me")?).bearer_auth(token).send().await?;
        Ok(Self::checked(response).await?.json().await?)
    }

    async fn search(&self, query: &str) -> Result<Vec<PackageSummary>, RegistryError> {
        let response = self.client.get(self.endpoint("api/v1/skills/search")?).query(&[("q", query)]).send().await?;
        Ok(Self::checked(response).await?.json().await?)
    }

    async fn index(&self, revision: Option<u64>) -> Result<RegistryIndex, RegistryError> {
        let response = self.client.get(self.endpoint("api/v1/registry/index")?).query(&[("revision", revision)]).send().await?;
        if response.status() == StatusCode::NOT_MODIFIED {
            return Ok(RegistryIndex { revision: revision.unwrap_or_default(), packages: Vec::new() });
        }
        Ok(Self::checked(response).await?.json().await?)
    }

    async fn resolve(&self, package: &str, selector: &str, token: Option<&str>) -> Result<ResolvedRelease, RegistryError> {
        let request = self.client.post(self.endpoint("api/v1/skills/resolve")?).json(&serde_json::json!({"package": package, "selector": selector}));
        Ok(Self::checked(Self::authorize(request, token).send().await?).await?.json().await?)
    }

    async fn download(&self, release: &ResolvedRelease, token: Option<&str>) -> Result<Vec<u8>, RegistryError> {
        let request = self.client.get(Url::parse(&release.download_url)?);
        Ok(Self::checked(Self::authorize(request, token).send().await?).await?.bytes().await?.to_vec())
    }

    async fn publish(&self, request: &PublishRequest, token: &str) -> Result<PublishResult, RegistryError> {
        let response = self.client.post(self.endpoint("api/v1/skills/publish")?).bearer_auth(token).json(request).send().await?;
        Ok(Self::checked(response).await?.json().await?)
    }
}
