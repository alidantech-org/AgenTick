use crate::{RuntimeError, RuntimeInputs};
use skillib_ir::{IrEvent, SkillIr};

pub fn select<'a>(ir: &'a SkillIr, inputs: &RuntimeInputs) -> Result<Option<&'a IrEvent>, RuntimeError> {
    if ir.events.is_empty() {
        return Ok(None);
    }
    let mut matches = Vec::new();
    for event in &ir.events {
        if event.condition.as_deref().map_or(Ok(true), |condition| evaluate(condition, inputs))? {
            matches.push(event);
        }
    }
    match matches.as_slice() {
        [] => Err(RuntimeError::NoEventMatched),
        [event] => Ok(Some(*event)),
        _ => Err(RuntimeError::MultipleEventsMatched),
    }
}

fn evaluate(condition: &str, inputs: &RuntimeInputs) -> Result<bool, RuntimeError> {
    for operator in ["==", "!="] {
        if let Some((left, right)) = condition.split_once(operator) {
            let Some(name) = left.trim().strip_prefix("input.") else {
                return Err(RuntimeError::UnsupportedCondition(condition.to_owned()));
            };
            let expected = right.trim().trim_matches('"');
            let actual = inputs.values.get(name).and_then(value_text);
            return Ok(if operator == "==" { actual.as_deref() == Some(expected) } else { actual.as_deref() != Some(expected) });
        }
    }
    Err(RuntimeError::UnsupportedCondition(condition.to_owned()))
}

fn value_text(value: &serde_json::Value) -> Option<String> {
    if let Some(value) = value.as_str() { return Some(value.to_owned()); }
    if let Some(value) = value.as_bool() { return Some(value.to_string()); }
    value.as_i64().map(|value| value.to_string())
}

#[cfg(test)]
mod tests {
    use super::evaluate;
    use crate::RuntimeInputs;

    #[test]
    fn evaluates_input_equality() {
        let mut inputs = RuntimeInputs::default();
        inputs.values.insert("trigger".into(), serde_json::json!("crash"));
        assert!(evaluate("input.trigger == \"crash\"", &inputs).unwrap());
    }
}
