//! Stable serializable Skillib intermediate representation.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use skillib_semantic::{SemanticEvent, SemanticInput, SemanticSkill, SemanticSource};
use std::collections::BTreeMap;

pub const IR_SCHEMA: &str = "skillib.ir/v1alpha1";

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SkillIr {
    pub schema: String,
    pub language_version: String,
    pub identity: String,
    pub version: Option<String>,
    pub description: String,
    pub dependencies: Vec<String>,
    pub classification: BTreeMap<String, Value>,
    pub goals: Vec<String>,
    pub inputs: BTreeMap<String, IrInput>,
    pub sources: BTreeMap<String, IrSource>,
    pub events: Vec<IrEvent>,
    pub process: Vec<String>,
    pub constraints: Vec<String>,
    pub expected: Vec<String>,
    pub output: BTreeMap<String, Value>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IrInput {
    pub kind: String,
    pub required: bool,
    pub default: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IrSource {
    pub provider: String,
    pub arguments: Vec<Value>,
    pub required: bool,
    pub trust: String,
    pub resolution: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct IrEvent {
    pub name: String,
    pub condition: Option<String>,
    pub priority: Option<String>,
    pub tone: Option<String>,
    pub avoid: Vec<String>,
}

impl From<SemanticSkill> for SkillIr {
    fn from(value: SemanticSkill) -> Self {
        Self {
            schema: IR_SCHEMA.to_owned(),
            language_version: value.language,
            identity: value.identity,
            version: value.version,
            description: value.description,
            dependencies: value.dependencies,
            classification: values(value.classification.values),
            goals: value.goals,
            inputs: value.inputs.into_iter().map(|(name, input)| (name, input.into())).collect(),
            sources: value.sources.into_iter().map(|(name, source)| (name, source.into())).collect(),
            events: value.events.into_iter().map(Into::into).collect(),
            process: value.process,
            constraints: value.constraints,
            expected: value.expected,
            output: values(value.output.values),
            permissions: value.permissions.into_iter().collect(),
        }
    }
}

impl From<SemanticInput> for IrInput {
    fn from(value: SemanticInput) -> Self {
        Self { kind: value.kind, required: value.required, default: value.default.and_then(|item| serde_json::to_value(item).ok()) }
    }
}

impl From<SemanticSource> for IrSource {
    fn from(value: SemanticSource) -> Self {
        Self {
            provider: value.provider,
            arguments: value.arguments.into_iter().filter_map(|item| serde_json::to_value(item).ok()).collect(),
            required: value.required,
            trust: value.trust,
            resolution: value.resolution,
        }
    }
}

impl From<SemanticEvent> for IrEvent {
    fn from(value: SemanticEvent) -> Self {
        Self { name: value.name, condition: value.condition, priority: value.priority, tone: value.tone, avoid: value.avoid }
    }
}

fn values<T: Serialize>(input: BTreeMap<String, T>) -> BTreeMap<String, Value> {
    input.into_iter().filter_map(|(key, value)| serde_json::to_value(value).ok().map(|value| (key, value))).collect()
}
