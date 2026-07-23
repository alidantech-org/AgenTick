use std::path::{Path, PathBuf};

pub struct PackageCache {
    root: PathBuf,
}

impl PackageCache {
    #[must_use]
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    #[must_use]
    pub fn project(root: &Path) -> Self {
        Self::new(root.join("agents/.skillib/cache"))
    }

    pub fn put(&self, integrity: &str, bytes: &[u8]) -> Result<PathBuf, crate::PackageError> {
        std::fs::create_dir_all(&self.root)?;
        let path = self.path_for(integrity);
        std::fs::write(&path, bytes)?;
        Ok(path)
    }

    pub fn get(&self, integrity: &str) -> Result<Option<Vec<u8>>, crate::PackageError> {
        let path = self.path_for(integrity);
        if !path.exists() {
            return Ok(None);
        }
        Ok(Some(std::fs::read(path)?))
    }

    #[must_use]
    pub fn path_for(&self, integrity: &str) -> PathBuf {
        let safe = integrity.replace(':', "-");
        self.root.join(format!("{safe}.skillpkg"))
    }
}
