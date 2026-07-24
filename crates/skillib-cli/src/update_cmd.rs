use anyhow::Result;
use skillib_package::Lockfile;
use std::path::Path;

pub async fn run(root: &Path, package: Option<&str>) -> Result<()> {
    let lock = Lockfile::read(&root.join("agents/skillib.lock.json"))?;
    if let Some(package) = package {
        let entry = lock.packages.get(package)
            .ok_or_else(|| anyhow::anyhow!("{package} is not installed"))?;
        return crate::registry_cmd::install(root, package, &entry.requested).await;
    }
    for (name, entry) in lock.packages {
        crate::registry_cmd::install(root, &name, &entry.requested).await?;
    }
    Ok(())
}
