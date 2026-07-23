//! Stable serializable intermediate representation.

use serde::{Deserialize, Serialize};
use skillib_semantic::SemanticSkill;
use std::collections::BTreeMap;

/// Current IR schema identifier.
pub const IR_SCHEMA: &str = "skillib.ir/v1alpha1";

/// Canonical compiler output understood by the registry and runtime.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SkillIr {
    /// IR schema identifier.
    pub schema: String,
    /// Language version used by the source.
    pub language_version: String,
    /// Package identity.
    pub identity: String,
    /// Optional package release version.
    pub version: Option<String>,
    /// Resolved later by the package subsystem.
    pub dependencies: Vec<String>,
    /// Canonically ordered language blocks.
    pub blocks: BTreeMap<String, Vec<String>>,
}

impl From<SemanticSkill> for SkillIr {
    fn from(value: SemanticSkill) -> Self {
        Self {
            schema: IR_SCHEMA.to_owned(),
            language_version: value.language,
            identity: value.identity,
            version: value.version,
            dependencies: value.dependencies,
            blocks: value.blocks,
        }
    }
}
