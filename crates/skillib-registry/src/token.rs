use crate::RegistryError;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize)]
struct StoredToken {
    token: String,
}

pub struct TokenStore {
    path: PathBuf,
}

impl TokenStore {
    #[must_use]
    pub fn project(root: &Path) -> Self {
        Self { path: root.join("agents/.skillib/auth.json") }
    }

    pub fn save(&self, token: &str) -> Result<(), RegistryError> {
        let parent = self.path.parent().ok_or(RegistryError::InvalidTokenPath)?;
        std::fs::create_dir_all(parent)?;
        let bytes = serde_json::to_vec(&StoredToken { token: token.to_owned() })?;
        std::fs::write(&self.path, bytes)?;
        self.restrict_permissions()?;
        Ok(())
    }

    pub fn load(&self) -> Result<Option<String>, RegistryError> {
        if !self.path.exists() {
            return Ok(None);
        }
        let value: StoredToken = serde_json::from_slice(&std::fs::read(&self.path)?)?;
        Ok(Some(value.token))
    }

    pub fn remove(&self) -> Result<bool, RegistryError> {
        if !self.path.exists() {
            return Ok(false);
        }
        std::fs::remove_file(&self.path)?;
        Ok(true)
    }

    #[cfg(unix)]
    fn restrict_permissions(&self) -> Result<(), RegistryError> {
        use std::os::unix::fs::PermissionsExt;
        let mut permissions = std::fs::metadata(&self.path)?.permissions();
        permissions.set_mode(0o600);
        std::fs::set_permissions(&self.path, permissions)?;
        Ok(())
    }

    #[cfg(not(unix))]
    fn restrict_permissions(&self) -> Result<(), RegistryError> {
        Ok(())
    }
}
