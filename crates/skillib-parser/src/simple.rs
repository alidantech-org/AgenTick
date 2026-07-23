use crate::{line::SourceLine, value::parse_value};
use skillib_ast::{ClassificationBlock, OutputDeclaration, ProcessStep, PropertyMap, Spanned};
use skillib_diagnostics::Diagnostic;

pub fn list(lines: &[SourceLine], diagnostics: &mut Vec<Diagnostic>) -> Vec<Spanned<String>> {
    lines.iter().filter_map(|line| {
        line.text.strip_prefix("- ").map(|value| Spanned { value: unquote(value), span: line.span }).or_else(|| {
            diagnostics.push(Diagnostic::error("SKL1010", "Expected a list item beginning with '- '", line.span));
            None
        })
    }).collect()
}

pub fn process(lines: &[SourceLine], diagnostics: &mut Vec<Diagnostic>) -> Vec<ProcessStep> {
    lines.iter().filter_map(|line| {
        let dot = line.text.find(". ")?;
        let Ok(position) = line.text[..dot].parse::<usize>() else {
            diagnostics.push(Diagnostic::error("SKL1011", "Invalid process step number", line.span));
            return None;
        };
        Some(ProcessStep {
            position,
            instruction: Spanned { value: line.text[dot + 2..].to_owned(), span: line.span },
        })
    }).collect()
}

pub fn classification(lines: &[SourceLine], diagnostics: &mut Vec<Diagnostic>) -> ClassificationBlock {
    ClassificationBlock { properties: properties(lines, diagnostics) }
}

pub fn output(lines: &[SourceLine], diagnostics: &mut Vec<Diagnostic>) -> OutputDeclaration {
    OutputDeclaration { properties: properties(lines, diagnostics) }
}

pub fn properties(lines: &[SourceLine], diagnostics: &mut Vec<Diagnostic>) -> PropertyMap {
    let mut map = PropertyMap::default();
    for line in lines {
        let Some((key, value)) = line.text.split_once(':') else {
            diagnostics.push(Diagnostic::error("SKL1012", "Expected property syntax 'name: value'", line.span));
            continue;
        };
        if value.trim().is_empty() {
            continue;
        }
        if map.values.insert(key.trim().to_owned(), parse_value(value)).is_some() {
            diagnostics.push(Diagnostic::error("SKL2002", format!("Duplicate property: {}", key.trim()), line.span));
        }
    }
    map
}

fn unquote(value: &str) -> String {
    value.trim().trim_matches('"').to_owned()
}
