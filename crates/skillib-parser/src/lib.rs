//! Recoverable parser for Skillib source documents.

mod line;
mod named;
mod simple;
mod value;

use line::SourceLine;
use skillib_ast::{DependencyDeclaration, SkillFile, Spanned};
use skillib_diagnostics::{Diagnostic, has_errors};
use skillib_source::{SourceFile, Span};
use skillib_syntax::lex;

#[derive(Debug)]
pub struct ParseResult {
    pub file: SkillFile,
    pub diagnostics: Vec<Diagnostic>,
}

impl ParseResult {
    #[must_use]
    pub fn is_valid(&self) -> bool { !has_errors(&self.diagnostics) }
}

#[must_use]
pub fn parse(source: &SourceFile) -> ParseResult {
    let (_, mut diagnostics) = lex(source);
    let lines = line::collect(source.text());
    let mut file = SkillFile::default();
    let mut index = 0usize;
    while index < lines.len() {
        let current = &lines[index];
        if current.indent != 0 {
            diagnostics.push(Diagnostic::error("SKL1004", "Indented content must belong to a top-level block", current.span));
            index += 1;
            continue;
        }
        if parse_statement(current, &mut file, &mut diagnostics) {
            index += 1;
            continue;
        }
        let Some(name) = current.text.strip_suffix(':') else {
            diagnostics.push(Diagnostic::error("SKL1006", "Unknown top-level statement", current.span));
            index += 1;
            continue;
        };
        let end = block_end(&lines, index + 1);
        parse_block(name, &lines[index + 1..end], &mut file, &mut diagnostics);
        index = end;
    }
    if file.identity.is_none() {
        diagnostics.push(Diagnostic::error("SKL1001", "Missing define declaration", Span::new(0, 0)));
    }
    ParseResult { file, diagnostics }
}

fn parse_statement(line: &SourceLine, file: &mut SkillFile, diagnostics: &mut Vec<Diagnostic>) -> bool {
    let (target, prefix) = if line.text.starts_with("define ") { (&mut file.identity, "define ") }
        else if line.text.starts_with("language ") { (&mut file.language, "language ") }
        else if line.text.starts_with("version ") { (&mut file.version, "version ") }
        else { return parse_use(line, file); };
    if target.is_some() {
        diagnostics.push(Diagnostic::error("SKL2002", format!("Duplicate {} declaration", prefix.trim()), line.span));
    } else {
        *target = Some(Spanned { value: unquote(&line.text[prefix.len()..]), span: line.span });
    }
    true
}

fn parse_use(line: &SourceLine, file: &mut SkillFile) -> bool {
    let Some(value) = line.text.strip_prefix("use ") else { return false; };
    file.dependencies.push(DependencyDeclaration {
        target: Spanned { value: unquote(value), span: line.span },
    });
    true
}

fn parse_block(name: &str, lines: &[SourceLine], file: &mut SkillFile, diagnostics: &mut Vec<Diagnostic>) {
    match name {
        "description" => file.description = text_lines(lines),
        "classify" => file.classification = Some(simple::classification(lines, diagnostics)),
        "goal" => file.goals = simple::list(lines, diagnostics),
        "source" => file.sources = named::sources(lines, diagnostics),
        "event" => file.events = named::events(lines, diagnostics),
        "input" => file.inputs = named::inputs(lines, diagnostics),
        "process" => file.process = simple::process(lines, diagnostics),
        "constraints" => file.constraints = simple::list(lines, diagnostics),
        "expected" => file.expected = simple::list(lines, diagnostics),
        "output" => file.output = Some(simple::output(lines, diagnostics)),
        _ => diagnostics.push(Diagnostic::error("SKL1005", format!("Unknown top-level block: {name}"), lines.first().map_or(Span::new(0, 0), |line| line.span))),
    }
}

fn text_lines(lines: &[SourceLine]) -> Vec<Spanned<String>> {
    lines.iter().map(|line| Spanned { value: line.text.clone(), span: line.span }).collect()
}

fn block_end(lines: &[SourceLine], mut index: usize) -> usize {
    while index < lines.len() && lines[index].indent > 0 { index += 1; }
    index
}

fn unquote(value: &str) -> String { value.trim().trim_matches('"').to_owned() }

#[cfg(test)]
mod tests {
    use super::parse;
    use skillib_source::SourceFile;

    #[test]
    fn parses_both_extensions() {
        for extension in ["sl", "skillib"] {
            let source = SourceFile::new(format!("test.{extension}"), "define @test/example\ninput:\n    name:\n        type: string\n").unwrap();
            let result = parse(&source);
            assert!(result.is_valid());
            assert_eq!(result.file.inputs.len(), 1);
        }
    }
}
