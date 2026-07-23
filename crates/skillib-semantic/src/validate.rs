use skillib_ast::{AstValue, SkillFile};
use skillib_diagnostics::Diagnostic;
use skillib_source::Span;
use std::collections::BTreeSet;

pub fn validate(file: &SkillFile) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    validate_identity(file, &mut diagnostics);
    validate_language(file, &mut diagnostics);
    unique(file.inputs.iter().map(|item| (&item.name.value, item.name.span)), "input", &mut diagnostics);
    unique(file.sources.iter().map(|item| (&item.name.value, item.name.span)), "source", &mut diagnostics);
    unique(file.events.iter().map(|item| (&item.name.value, item.name.span)), "event", &mut diagnostics);
    validate_inputs(file, &mut diagnostics);
    validate_sources(file, &mut diagnostics);
    validate_events(file, &mut diagnostics);
    validate_output(file, &mut diagnostics);
    diagnostics
}

fn validate_identity(file: &SkillFile, diagnostics: &mut Vec<Diagnostic>) {
    let Some(identity) = &file.identity else { return; };
    if !package_id(&identity.value) {
        diagnostics.push(Diagnostic::error("SKL2001", "Package identity must use @namespace/name", identity.span));
    }
}

fn validate_language(file: &SkillFile, diagnostics: &mut Vec<Diagnostic>) {
    if let Some(language) = &file.language
        && language.value != "0.1"
    {
        diagnostics.push(Diagnostic::error("SKL3001", "Unsupported language version; expected 0.1", language.span));
    }
}

fn validate_inputs(file: &SkillFile, diagnostics: &mut Vec<Diagnostic>) {
    for input in &file.inputs {
        let kind = input.properties.string("type").unwrap_or("string");
        if !matches!(kind, "string" | "integer" | "boolean") && !kind.starts_with("enum(") {
            diagnostics.push(Diagnostic::error("SKL3002", format!("Unknown input type: {kind}"), input.name.span));
        }
        if let Some(default) = input.properties.values.get("default")
            && !default_matches(kind, default)
        {
            diagnostics.push(Diagnostic::error("SKL3005", "Default value does not match input type", input.name.span));
        }
    }
}

fn validate_sources(file: &SkillFile, diagnostics: &mut Vec<Diagnostic>) {
    for source in &file.sources {
        match source.properties.values.get("from") {
            Some(AstValue::Call(call)) if matches!(call.name.as_str(), "file" | "workspace" | "url" | "skill") => {}
            Some(AstValue::Call(call)) => diagnostics.push(Diagnostic::error("SKL6002", format!("Unknown source provider: {}", call.name), source.name.span)),
            _ => diagnostics.push(Diagnostic::error("SKL6001", "Source requires a from: provider(...) declaration", source.name.span)),
        }
    }
}

fn validate_events(file: &SkillFile, diagnostics: &mut Vec<Diagnostic>) {
    let inputs: BTreeSet<_> = file.inputs.iter().map(|item| item.name.value.as_str()).collect();
    for event in &file.events {
        if let Some(condition) = event.properties.string("when") {
            for reference in input_references(condition) {
                if !inputs.contains(reference.as_str()) {
                    diagnostics.push(Diagnostic::error("SKL2204", format!("Unknown input reference: {reference}"), event.name.span));
                }
            }
        }
    }
}

fn validate_output(file: &SkillFile, diagnostics: &mut Vec<Diagnostic>) {
    let inputs: BTreeSet<_> = file.inputs.iter().map(|item| item.name.value.as_str()).collect();
    let Some(output) = &file.output else { return; };
    for value in output.properties.values.values() {
        if let AstValue::String(text) = value {
            for placeholder in placeholders(text) {
                if !inputs.contains(placeholder.as_str()) {
                    diagnostics.push(Diagnostic::error("SKL7004", format!("Unknown output placeholder: {placeholder}"), Span::new(0, 0)));
                }
            }
        }
    }
}

fn unique<'a>(values: impl Iterator<Item = (&'a String, Span)>, kind: &str, diagnostics: &mut Vec<Diagnostic>) {
    let mut seen = BTreeSet::new();
    for (value, span) in values {
        if !seen.insert(value) {
            diagnostics.push(Diagnostic::error("SKL2002", format!("Duplicate {kind}: {value}"), span));
        }
    }
}

fn package_id(value: &str) -> bool {
    value.strip_prefix('@').is_some_and(|rest| {
        let mut parts = rest.split('/');
        parts.next().is_some_and(valid_name) && parts.next().is_some_and(valid_name) && parts.next().is_none()
    })
}

fn valid_name(value: &str) -> bool {
    !value.is_empty() && value.chars().all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '-')
}

fn default_matches(kind: &str, value: &AstValue) -> bool {
    matches!((kind, value), ("string", AstValue::String(_)) | ("integer", AstValue::Number(_)) | ("boolean", AstValue::Boolean(_)))
        || kind.starts_with("enum(") && matches!(value, AstValue::String(_))
}

fn input_references(text: &str) -> Vec<String> { references(text, "input.") }
fn placeholders(text: &str) -> Vec<String> { text.split('{').skip(1).filter_map(|part| part.split('}').next()).map(str::to_owned).collect() }
fn references(text: &str, prefix: &str) -> Vec<String> {
    text.match_indices(prefix).map(|(index, _)| text[index + prefix.len()..].chars().take_while(|ch| ch.is_ascii_alphanumeric() || *ch == '_').collect()).collect()
}
