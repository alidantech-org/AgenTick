use skillib_ast::{AstValue, CallValue};

pub fn parse_value(input: &str) -> AstValue {
    let value = input.trim();
    if value.starts_with('"') && value.ends_with('"') && value.len() >= 2 {
        return AstValue::String(value[1..value.len() - 1].to_owned());
    }
    if value == "true" { return AstValue::Boolean(true); }
    if value == "false" { return AstValue::Boolean(false); }
    if let Ok(number) = value.parse::<i64>() { return AstValue::Number(number); }
    if value.starts_with('[') && value.ends_with(']') {
        return AstValue::Array(split_arguments(&value[1..value.len() - 1]).into_iter().map(parse_value).collect());
    }
    if let Some(open) = value.find('(')
        && value.ends_with(')')
    {
        return AstValue::Call(CallValue {
            name: value[..open].trim().to_owned(),
            arguments: split_arguments(&value[open + 1..value.len() - 1]).into_iter().map(parse_value).collect(),
        });
    }
    AstValue::Reference(value.to_owned())
}

fn split_arguments(input: &str) -> Vec<&str> {
    let mut values = Vec::new();
    let mut start = 0usize;
    let mut quoted = false;
    let mut depth = 0usize;
    for (index, character) in input.char_indices() {
        match character {
            '"' => quoted = !quoted,
            '[' | '(' if !quoted => depth += 1,
            ']' | ')' if !quoted => depth = depth.saturating_sub(1),
            ',' if !quoted && depth == 0 => {
                values.push(input[start..index].trim());
                start = index + 1;
            }
            _ => {}
        }
    }
    let tail = input[start..].trim();
    if !tail.is_empty() { values.push(tail); }
    values
}

#[cfg(test)]
mod tests {
    use super::parse_value;
    use skillib_ast::AstValue;

    #[test]
    fn parses_arrays_and_calls() {
        assert!(matches!(parse_value("[\"a\", \"b\"]"), AstValue::Array(values) if values.len() == 2));
        assert!(matches!(parse_value("file(\"a.log\")"), AstValue::Call(call) if call.name == "file"));
    }
}
