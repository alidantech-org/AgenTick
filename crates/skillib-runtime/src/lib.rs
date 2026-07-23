//! Runtime planning for compiled Skillib skills.

use serde::{Deserialize, Serialize};
use skillib_ir::SkillIr;
use std::collections::BTreeMap;

/// Runtime values supplied for one execution.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RuntimeInputs {
    /// Named string values for the first language version.
    pub values: BTreeMap<String, String>,
}

/// A safe plan produced before any source is mounted or model is invoked.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionPlan {
    /// Package identity.
    pub identity: String,
    /// Runtime values.
    pub inputs: RuntimeInputs,
    /// Declared source lines awaiting policy-controlled resolution.
    pub sources: Vec<String>,
    /// Declared event lines awaiting typed event support.
    pub events: Vec<String>,
}

/// Creates a source-resolution-free execution plan.
#[must_use]
pub fn plan(ir: &SkillIr, inputs: RuntimeInputs) -> ExecutionPlan {
    ExecutionPlan {
        identity: ir.identity.clone(),
        inputs,
        sources: ir.blocks.get("source").cloned().unwrap_or_default(),
        events: ir.blocks.get("event").cloned().unwrap_or_default(),
    }
}
