use crate::RuntimeError;
use serde::{Deserialize, Serialize};
use skillib_ir::SkillIr;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RuntimeInputs {
    pub values: BTreeMap<String, serde_json::Value>,
}

pub fn validate(ir: &SkillIr, mut inputs: RuntimeInputs) -> Result<RuntimeInputs, RuntimeError> {
    for (name, declaration) in &ir.inputs {
        if !inputs.values.contains_key(name)
            && let Some(default) = &declaration.default
        {
            inputs.values.insert(name.clone(), default.clone());
        }
        let Some(value) = inputs.values.get(name) else {
            if declaration.required {
                return Err(RuntimeError::MissingInput(name.clone()));
            }
            continue;
        };
        if !matches_type(&declaration.kind, value) {
            return Err(RuntimeError::InvalidInputType {
                name: name.clone(),
                kind: declaration.kind.clone(),
            });
        }
    }
    Ok(inputs)
}

fn matches_type(kind: &str, value: &serde_json::Value) -> bool {
    match kind {
        "string" => value.is_string(),
        "integer" => value.as_i64().is_some(),
        "boolean" => value.is_boolean(),
        _ if kind.starts_with("enum(") => value.as_str().is_some_and(|item| enum_values(kind).iter().any(|allowed| allowed == item)),
        _ => false,
    }
}

fn enum_values(kind: &str) -> Vec<String> {
    kind.strip_prefix("enum(").and_then(|value| value.strip_suffix(')'))
        .map(|value| value.split(',').map(|item| item.trim().trim_matches('"').to_owned()).collect())
        .unwrap_or_default()
}
