use serde::{Deserialize, Serialize};
use skillib_ir::SkillIr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageArchive {
    pub format: u32,
    pub extension: String,
    pub source: String,
    pub ir: SkillIr,
    pub source_hash: String,
    pub ir_hash: String,
}

impl PackageArchive {
    pub fn new(extension: String, source: String, ir: SkillIr) -> Result<Self, crate::PackageError> {
        let source_hash = blake3::hash(source.as_bytes()).to_hex().to_string();
        let ir_bytes = serde_json::to_vec(&ir)?;
        let ir_hash = blake3::hash(&ir_bytes).to_hex().to_string();
        Ok(Self { format: 1, extension, source, ir, source_hash, ir_hash })
    }

    pub fn encode(&self) -> Result<Vec<u8>, crate::PackageError> {
        Ok(serde_json::to_vec(self)?)
    }

    pub fn decode(bytes: &[u8]) -> Result<Self, crate::PackageError> {
        let archive: Self = serde_json::from_slice(bytes)?;
        archive.verify()?;
        Ok(archive)
    }

    pub fn integrity(&self) -> Result<String, crate::PackageError> {
        Ok(format!("blake3:{}", blake3::hash(&self.encode()?).to_hex()))
    }

    pub fn verify(&self) -> Result<(), crate::PackageError> {
        let source = blake3::hash(self.source.as_bytes()).to_hex().to_string();
        let ir = blake3::hash(&serde_json::to_vec(&self.ir)?).to_hex().to_string();
        if source != self.source_hash || ir != self.ir_hash {
            return Err(crate::PackageError::IntegrityMismatch);
        }
        Ok(())
    }
}
