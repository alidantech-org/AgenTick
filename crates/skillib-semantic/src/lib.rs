//! Semantic validation and normalized Skillib model.

mod lower;
mod lower_events;
mod lower_inputs;
mod lower_sources;
mod model;
mod validate;

use skillib_ast::SkillFile;
use skillib_diagnostics::{Diagnostic, has_errors};

pub use model::{SemanticEvent, SemanticInput, SemanticSkill, SemanticSource};

#[derive(Debug)]
pub struct SemanticResult {
    pub model: Option<SemanticSkill>,
    pub diagnostics: Vec<Diagnostic>,
}

#[must_use]
pub fn analyze(file: &SkillFile) -> SemanticResult {
    let diagnostics = validate::validate(file);
    let model = (!has_errors(&diagnostics))
        .then(|| lower::lower(file))
        .flatten();
    SemanticResult { model, diagnostics }
}
