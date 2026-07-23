use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, path::Path};

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Lockfile {
    pub version: u32,
    pub packages: BTreeMap<String, LockedPackage>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LockedPackage {
    pub requested: String,
    pub release: u64,
    pub version: String,
    pub integrity: String,
    pub registry: String,
}

impl Lockfile {
    #[must_use]
    pub fn empty() -> Self {
        Self { version: 1, packages: BTreeMap::new() }
    }

    pub fn read(path: &Path) -> Result<Self, crate::PackageError> {
        if !path.exists() {
            return Ok(Self::empty());
        }
        Ok(serde_json::from_slice(&std::fs::read(path)?)?)
    }

    pub fn write(&self, path: &Path) -> Result<(), crate::PackageError> {
        let bytes = serde_json::to_vec_pretty(self)?;
        std::fs::write(path, bytes)?;
        Ok(())
    }
}
