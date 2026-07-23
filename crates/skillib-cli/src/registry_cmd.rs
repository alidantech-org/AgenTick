use crate::{language, ui};
use anyhow::{Context, Result};
use skillib_compiler::{Compiler, SkillCompiler};
use skillib_package::{LockedPackage, Lockfile, PackageArchive, PackageCache};
use skillib_registry::{HttpRegistryClient, PublishRequest, RegistryClient, TokenStore};
use std::path::{Path, PathBuf};
use url::Url;

pub async fn login(root: &Path, token: Option<String>) -> Result<()> {
    ui::heading("login", None);
    let token = token.or_else(|| std::env::var("SKILLIB_TOKEN").ok()).context("pass --token or set SKILLIB_TOKEN")?;
    let client = client()?;
    let identity = client.identity(&token).await?;
    TokenStore::project(root).save(&token)?;
    ui::success(format!("logged in as @{}", identity.handle));
    Ok(())
}

pub fn logout(root: &Path) -> Result<()> {
    ui::heading("logout", None);
    if TokenStore::project(root).remove()? { ui::success("credentials removed"); }
    else { ui::info("no credentials found"); }
    Ok(())
}

pub async fn whoami(root: &Path) -> Result<()> {
    ui::heading("whoami", None);
    let token = required_token(root)?;
    let identity = client()?.identity(&token).await?;
    ui::info(format!("handle  @{}", identity.handle));
    ui::info(format!("scopes  {}", identity.scopes.join(", ")));
    ui::success("authenticated");
    Ok(())
}

pub async fn search(query: &str) -> Result<()> {
    ui::heading("search", None);
    for package in client()?.search(query).await? {
        ui::info(format!("{:<36} {:<10} {}", package.id, package.latest, package.description));
    }
    ui::success("search complete");
    Ok(())
}

pub async fn install(root: &Path, package: &str, selector: &str) -> Result<()> {
    ui::heading("install", None);
    let token = TokenStore::project(root).load()?;
    let registry = client()?;
    let release = registry.resolve(package, selector, token.as_deref()).await?;
    let cache = PackageCache::project(root);
    let bytes = match cache.get(&release.integrity)? {
        Some(bytes) => bytes,
        None => {
            let bytes = registry.download(&release, token.as_deref()).await?;
            verify_integrity(&bytes, &release.integrity)?;
            cache.put(&release.integrity, &bytes)?;
            bytes
        }
    };
    let archive = PackageArchive::decode(&bytes)?;
    write_install(root, &release.package, release.release, &archive)?;
    update_lock(root, package, selector, &release)?;
    ui::success(format!("installed {} release {}", release.package, release.release));
    Ok(())
}

pub async fn publish(root: &Path, file: &Path, package: &str, visibility: &str) -> Result<()> {
    ui::heading("publish", Some(file));
    let source = language::load(file)?;
    let compiled = SkillCompiler.compile(&source);
    anyhow::ensure!(compiled.success, "skill does not compile");
    let ir = compiled.ir.context("compiler returned no IR")?;
    let extension = file.extension().and_then(|value| value.to_str()).unwrap_or("skillib");
    let request = PublishRequest {
        package: package.to_owned(),
        source: source.text().to_owned(),
        extension: extension.to_owned(),
        ir: serde_json::to_value(ir)?,
        source_hash: compiled.source_hash,
        ir_hash: compiled.ir_hash.context("compiler returned no IR hash")?,
        compiler_version: env!("CARGO_PKG_VERSION").to_owned(),
        visibility: visibility.to_owned(),
    };
    let result = client()?.publish(&request, &required_token(root)?).await?;
    ui::success(format!("published {} release {} ({})", result.package, result.release, result.integrity));
    Ok(())
}

pub fn remove(root: &Path, package: &str) -> Result<()> {
    ui::heading("remove", None);
    let path = install_root(root, package);
    if path.exists() { std::fs::remove_dir_all(path)?; }
    let lock_path = root.join("agents/skillib.lock.json");
    let mut lock = Lockfile::read(&lock_path)?;
    lock.packages.remove(package);
    lock.write(&lock_path)?;
    ui::success(format!("removed {package}"));
    Ok(())
}

fn client() -> Result<HttpRegistryClient> {
    let url = std::env::var("SKILLIB_REGISTRY_URL").unwrap_or_else(|_| "http://127.0.0.1:3000/".into());
    Ok(HttpRegistryClient::new(Url::parse(&url)?))
}

fn required_token(root: &Path) -> Result<String> {
    TokenStore::project(root).load()?.context("run skillib login first")
}

fn verify_integrity(bytes: &[u8], expected: &str) -> Result<()> {
    let actual = format!("blake3:{}", blake3::hash(bytes).to_hex());
    anyhow::ensure!(actual == expected, "package integrity mismatch");
    Ok(())
}

fn write_install(root: &Path, package: &str, release: u64, archive: &PackageArchive) -> Result<()> {
    let target = install_root(root, package).join(release.to_string());
    std::fs::create_dir_all(&target)?;
    std::fs::write(target.join(format!("skill.{}", archive.extension)), &archive.source)?;
    std::fs::write(target.join("skill.ir.json"), serde_json::to_vec_pretty(&archive.ir)?)?;
    Ok(())
}

fn install_root(root: &Path, package: &str) -> PathBuf {
    root.join("agents/skillib").join(package.replace('/', "/"))
}

fn update_lock(root: &Path, package: &str, requested: &str, release: &skillib_registry::ResolvedRelease) -> Result<()> {
    let path = root.join("agents/skillib.lock.json");
    let mut lock = Lockfile::read(&path)?;
    lock.packages.insert(package.to_owned(), LockedPackage {
        requested: requested.to_owned(), release: release.release, version: release.version.clone(),
        integrity: release.integrity.clone(), registry: std::env::var("SKILLIB_REGISTRY_URL").unwrap_or_default(),
    });
    lock.write(&path)?;
    Ok(())
}
