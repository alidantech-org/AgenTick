//! Lexical analysis for the Skillib language.

use serde::{Deserialize, Serialize};
use skillib_diagnostics::Diagnostic;
use skillib_source::{SourceFile, Span};

/// Token categories needed by the parser and editor tooling.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TokenKind {
    Word,
    String,
    Colon,
    Dash,
    Numbered,
    Newline,
    Eof,
}

/// A lexical token with source location.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Token {
    pub kind: TokenKind,
    pub text: String,
    pub span: Span,
    pub indent: usize,
}

/// Tokenizes a source document while preserving indentation.
#[must_use]
pub fn lex(source: &SourceFile) -> (Vec<Token>, Vec<Diagnostic>) {
    let mut tokens = Vec::new();
    let mut diagnostics = Vec::new();
    let mut offset = 0;

    for line in source.text().split_inclusive('\n') {
        let body = line.trim_end_matches(['\r', '\n']);
        let indent = body.chars().take_while(|ch| *ch == ' ').count();
        if body
            .chars()
            .take_while(|ch| ch.is_whitespace())
            .any(|ch| ch == '\t')
        {
            diagnostics.push(Diagnostic::error(
                "SKL1002",
                "Tabs are not allowed; use four spaces",
                Span::new(offset, offset + indent.max(1)),
            ));
        }
        tokenize_line(body, indent, offset, &mut tokens);
        tokens.push(Token {
            kind: TokenKind::Newline,
            text: "\n".into(),
            span: Span::new(offset + body.len(), offset + line.len()),
            indent,
        });
        offset += line.len();
    }
    tokens.push(Token {
        kind: TokenKind::Eof,
        text: String::new(),
        span: Span::new(offset, offset),
        indent: 0,
    });
    (tokens, diagnostics)
}

fn tokenize_line(line: &str, indent: usize, offset: usize, output: &mut Vec<Token>) {
    let trimmed = line.trim();
    if trimmed.is_empty() || trimmed.starts_with('#') {
        return;
    }
    let start = offset + indent;
    let kind = if trimmed.starts_with("- ") {
        TokenKind::Dash
    } else if trimmed
        .chars()
        .next()
        .is_some_and(|ch| ch.is_ascii_digit())
        && trimmed.contains(". ")
    {
        TokenKind::Numbered
    } else if trimmed.ends_with(':') {
        TokenKind::Colon
    } else if trimmed.starts_with('"') && trimmed.ends_with('"') {
        TokenKind::String
    } else {
        TokenKind::Word
    };
    output.push(Token {
        kind,
        text: trimmed.to_owned(),
        span: Span::new(start, start + trimmed.len()),
        indent,
    });
}
