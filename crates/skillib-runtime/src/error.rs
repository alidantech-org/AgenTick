#[derive(Debug, thiserror::Error)]
pub enum RuntimeError {
    #[error("missing required input: {0}")]
    MissingInput(String),
    #[error("input {name} does not match type {kind}")]
    InvalidInputType { name: String, kind: String },
    #[error("no event matched the runtime inputs")]
    NoEventMatched,
    #[error("multiple events matched the runtime inputs")]
    MultipleEventsMatched,
    #[error("unsupported event condition: {0}")]
    UnsupportedCondition(String),
}
