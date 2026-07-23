use crate::{line::SourceLine, simple};
use skillib_ast::{EventDeclaration, InputDeclaration, SourceDeclaration, Spanned};
use skillib_diagnostics::Diagnostic;

pub fn inputs(lines: &[SourceLine], diagnostics: &mut Vec<Diagnostic>) -> Vec<InputDeclaration> {
    groups(lines, diagnostics).into_iter().map(|(name, span, body)| InputDeclaration {
        name: Spanned { value: name, span },
        properties: simple::properties(&body, diagnostics),
    }).collect()
}

pub fn sources(lines: &[SourceLine], diagnostics: &mut Vec<Diagnostic>) -> Vec<SourceDeclaration> {
    groups(lines, diagnostics).into_iter().map(|(name, span, body)| SourceDeclaration {
        name: Spanned { value: name, span },
        properties: simple::properties(&body, diagnostics),
    }).collect()
}

pub fn events(lines: &[SourceLine], diagnostics: &mut Vec<Diagnostic>) -> Vec<EventDeclaration> {
    groups(lines, diagnostics).into_iter().map(|(raw_name, span, body)| {
        let name = raw_name.strip_prefix("on ").unwrap_or(&raw_name).trim_matches('"').to_owned();
        let mut property_lines = Vec::new();
        let mut avoid = Vec::new();
        let mut in_avoid = false;
        for line in body {
            if line.text == "avoid:" {
                in_avoid = true;
            } else if in_avoid && line.text.starts_with("- ") {
                avoid.push(Spanned { value: line.text[2..].trim_matches('"').to_owned(), span: line.span });
            } else {
                in_avoid = false;
                property_lines.push(line);
            }
        }
        EventDeclaration {
            name: Spanned { value: name, span },
            properties: simple::properties(&property_lines, diagnostics),
            avoid,
        }
    }).collect()
}

fn groups(lines: &[SourceLine], diagnostics: &mut Vec<Diagnostic>) -> Vec<(String, skillib_source::Span, Vec<SourceLine>)> {
    let mut output = Vec::new();
    let mut index = 0usize;
    while index < lines.len() {
        let header = &lines[index];
        if header.indent != 4 || !header.text.ends_with(':') {
            diagnostics.push(Diagnostic::error("SKL1013", "Expected a named declaration", header.span));
            index += 1;
            continue;
        }
        let name = header.text.trim_end_matches(':').to_owned();
        let mut body = Vec::new();
        index += 1;
        while index < lines.len() && lines[index].indent > 4 {
            body.push(lines[index].clone());
            index += 1;
        }
        output.push((name, header.span, body));
    }
    output
}
