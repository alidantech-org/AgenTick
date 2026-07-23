use serde::{Deserialize, Serialize};
use skillib_ast::{AstValue, PropertyMap};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticSkill {
    pub identity: String,
    pub language: String,
    pub version: Option<String>,
    pub description: String,
    pub dependencies: Vec<String>,
    pub classification: PropertyMap,
    pub goals: Vec<String>,
    pub inputs: BTreeMap<String, SemanticInput>,
    pub sources: BTreeMap<String, SemanticSource>,
    pub events: Vec<SemanticEvent>,
    pub process: Vec<String>,
    pub constraints: Vec<String>,
    pub expected: Vec<String>,
    pub output: PropertyMap,
    pub permissions: BTreeSet<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticInput {
    pub kind: String,
    pub required: bool,
    pub default: Option<AstValue>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticSource {
    pub provider: String,
    pub arguments: Vec<AstValue>,
    pub required: bool,
    pub trust: String,
    pub resolution: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticEvent {
    pub name: String,
    pub condition: Option<String>,
    pub priority: Option<String>,
    pub tone: Option<String>,
    pub avoid: Vec<String>,
}
