//! Recoverable parser for Skillib source documents.

use skillib_ast::{Block, BlockKind, SkillFile, Spanned};
use skillib_diagnostics::{Diagnostic, has_errors};
use skillib_source::{SourceFile, Span};
use skillib_syntax::{TokenKind, lex};

/// Parser output with partial AST and diagnostics.
#[derive(Debug)]
pub struct ParseResult {
    /// Partial or complete syntax tree.
    pub file: SkillFile,
    /// Syntax diagnostics.
    pub diagnostics: Vec<Diagnostic>,
}

impl ParseResult {
    /// Returns true when parsing produced no errors.
    #[must_use]
    pub fn is_valid(&self) -> bool {
        !has_errors(&self.diagnostics)
    }
}

/// Parses a `.sl` or `.skillib` source.
#[must_use]
pub fn parse(source: &SourceFile) -> ParseResult {
    let (tokens, mut diagnostics) = lex(source);
    let mut file = SkillFile::default();
    let mut active_block = None;

    for token in tokens.into_iter().filter(|item| item.kind != TokenKind::Newline) {
        if token.kind == TokenKind::Eof {
            break;
        }
        if token.indent == 0 {
            active_block = parse_top_level(&token.text, token.span, &mut file, &mut diagnostics);
            continue;
        }
        if token.indent % 4 != 0 {
            diagnostics.push(Diagnostic::error(
                "SKL1003",
                "Indentation must use multiples of four spaces",
                token.span,
            ));
        }
        if let Some(kind) = active_block {
            file.blocks
                .entry(kind)
                .or_insert_with(Block::default)
                .lines
                .push(Spanned { value: token.text, span: token.span });
        } else {
            diagnostics.push(Diagnostic::error(
                "SKL1004",
                "Indented content must belong to a top-level block",
                token.span,
            ));
        }
    }

    if file.identity.is_none() {
        diagnostics.push(Diagnostic::error(
            "SKL1001",
            "Missing define declaration",
            Span::new(0, 0),
        ));
    }
    ParseResult { file, diagnostics }
}

fn parse_top_level(
    line: &str,
    span: Span,
    file: &mut SkillFile,
    diagnostics: &mut Vec<Diagnostic>,
) -> Option<BlockKind> {
    if let Some(value) = line.strip_prefix("define ") {
        file.identity = Some(spanned(unquote(value), span));
    } else if let Some(value) = line.strip_prefix("language ") {
        file.language = Some(spanned(unquote(value), span));
    } else if let Some(value) = line.strip_prefix("version ") {
        file.version = Some(spanned(unquote(value), span));
    } else if let Some(value) = line.strip_prefix("use ") {
        file.uses.push(spanned(unquote(value), span));
    } else if line == "description:" {
        return None;
    } else if let Some(name) = line.strip_suffix(':') {
        if let Some(kind) = BlockKind::parse(name) {
            return Some(kind);
        }
        diagnostics.push(Diagnostic::error("SKL1005", "Unknown top-level block", span));
    } else {
        diagnostics.push(Diagnostic::error("SKL1006", "Unknown top-level statement", span));
    }
    None
}

fn spanned(value: String, span: Span) -> Spanned<String> {
    Spanned { value, span }
}

fn unquote(value: &str) -> String {
    value.trim().trim_matches('"').to_owned()
}
