//! Safe runtime validation and execution planning for compiled Skillib skills.

mod events;
mod inputs;
mod plan;

pub use inputs::RuntimeInputs;
pub use plan::{ExecutionPlan, SourcePlan, plan};

/// Runtime validation and event-selection failures.
#[derive(Debug, thiserror::Error)]
pub enum RuntimeError {
    /// A required input was not supplied and has no default.
    #[error("missing required input: {0}")]
    MissingInput(String),
    /// A supplied value does not match the declared input type.
    #[error("input {name} must be {kind}")]
    InvalidInputType {
        /// Input name.
        name: String,
        /// Expected type.
        kind: String,
    },
    /// More than one event matched the supplied runtime values.
    #[error("multiple events matched: {0}")]
    MultipleEvents(String),
}
