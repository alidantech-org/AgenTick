//! Typed abstract syntax tree for Skillib 0.1.

mod declarations;
mod skill;
mod value;

use serde::{Deserialize, Serialize};
use skillib_source::Span;

pub use declarations::{ClassificationBlock, DependencyDeclaration, EventCondition, EventDeclaration, InputDeclaration, OutputDeclaration, ProcessStep, SourceDeclaration};
pub use skill::SkillFile;
pub use value::{AstValue, CallValue, PropertyMap};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Spanned<T> {
    pub value: T,
    pub span: Span,
}
