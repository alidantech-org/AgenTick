use crate::{RuntimeError, RuntimeInputs, events, inputs};
use serde::{Deserialize, Serialize};
use skillib_ir::SkillIr;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourcePlan {
    pub provider: String,
    pub arguments: Vec<serde_json::Value>,
    pub required: bool,
    pub trust: String,
    pub resolution: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionPlan {
    pub identity: String,
    pub version: Option<String>,
    pub inputs: RuntimeInputs,
    pub selected_event: Option<String>,
    pub sources: BTreeMap<String, SourcePlan>,
    pub permissions: Vec<String>,
}

pub fn plan(ir: &SkillIr, supplied: RuntimeInputs) -> Result<ExecutionPlan, RuntimeError> {
    let inputs = inputs::validate(ir, supplied)?;
    let selected_event = events::select(ir, &inputs)?.map(|event| event.name.clone());
    let sources = ir.sources.iter().map(|(name, source)| {
        (name.clone(), SourcePlan {
            provider: source.provider.clone(),
            arguments: source.arguments.clone(),
            required: source.required,
            trust: source.trust.clone(),
            resolution: source.resolution.clone(),
        })
    }).collect();
    Ok(ExecutionPlan {
        identity: ir.identity.clone(),
        version: ir.version.clone(),
        inputs,
        selected_event,
        sources,
        permissions: ir.permissions.clone(),
    })
}
