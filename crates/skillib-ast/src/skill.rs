use crate::{ClassificationBlock, DependencyDeclaration, EventDeclaration, InputDeclaration, OutputDeclaration, ProcessStep, SourceDeclaration, Spanned};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct SkillFile {
    pub identity: Option<Spanned<String>>,
    pub language: Option<Spanned<String>>,
    pub version: Option<Spanned<String>>,
    pub description: Vec<Spanned<String>>,
    pub dependencies: Vec<DependencyDeclaration>,
    pub classification: Option<ClassificationBlock>,
    pub goals: Vec<Spanned<String>>,
    pub sources: Vec<SourceDeclaration>,
    pub events: Vec<EventDeclaration>,
    pub inputs: Vec<InputDeclaration>,
    pub process: Vec<ProcessStep>,
    pub constraints: Vec<Spanned<String>>,
    pub expected: Vec<Spanned<String>>,
    pub output: Option<OutputDeclaration>,
}
