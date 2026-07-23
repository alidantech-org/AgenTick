//! Typed abstract syntax tree for Skillib 0.1.

use serde::{Deserialize, Serialize};
use skillib_source::Span;
use std::collections::BTreeMap;

/// A parsed Skillib document.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct SkillFile {
    /// Package identity from `define`.
    pub identity: Option<Spanned<String>>,
    /// Language version.
    pub language: Option<Spanned<String>>,
    /// Release version.
    pub version: Option<Spanned<String>>,
    /// Optional description.
    pub description: Vec<Spanned<String>>,
    /// Package dependencies.
    pub uses: Vec<Spanned<String>>,
    /// Structured named blocks.
    pub blocks: BTreeMap<BlockKind, Block>,
}

/// A value carrying its source location.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Spanned<T> {
    /// Parsed value.
    pub value: T,
    /// Source location.
    pub span: Span,
}

/// Supported top-level blocks.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BlockKind {
    /// Classification metadata.
    Classify,
    /// Primary goals.
    Goal,
    /// Source declarations.
    Source,
    /// Event branches.
    Event,
    /// Runtime inputs.
    Input,
    /// Ordered instructions.
    Process,
    /// Mandatory restrictions.
    Constraints,
    /// Required response content.
    Expected,
    /// Output declaration.
    Output,
}

/// A block represented as ordered lines for semantic lowering.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Block {
    /// Block lines in source order.
    pub lines: Vec<Spanned<String>>,
}

impl BlockKind {
    /// Resolves a top-level block name.
    #[must_use]
    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "classify" => Some(Self::Classify),
            "goal" => Some(Self::Goal),
            "source" => Some(Self::Source),
            "event" => Some(Self::Event),
            "input" => Some(Self::Input),
            "process" => Some(Self::Process),
            "constraints" => Some(Self::Constraints),
            "expected" => Some(Self::Expected),
            "output" => Some(Self::Output),
            _ => None,
        }
    }
}
