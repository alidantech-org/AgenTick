use crate::{AstValue, PropertyMap, Spanned};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct ClassificationBlock {
    pub properties: PropertyMap,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InputDeclaration {
    pub name: Spanned<String>,
    pub properties: PropertyMap,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SourceDeclaration {
    pub name: Spanned<String>,
    pub properties: PropertyMap,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EventDeclaration {
    pub name: Spanned<String>,
    pub properties: PropertyMap,
    pub avoid: Vec<Spanned<String>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProcessStep {
    pub position: usize,
    pub instruction: Spanned<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct OutputDeclaration {
    pub properties: PropertyMap,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DependencyDeclaration {
    pub target: Spanned<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EventCondition {
    pub left: String,
    pub operator: String,
    pub right: AstValue,
}
