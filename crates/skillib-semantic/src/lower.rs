use crate::{SemanticSkill, lower_events, lower_inputs, lower_sources};
use skillib_ast::SkillFile;

pub fn lower(file: &SkillFile) -> Option<SemanticSkill> {
    let identity = file.identity.as_ref()?.value.clone();
    let (sources, permissions) = lower_sources::lower(file);
    Some(SemanticSkill {
        identity,
        language: file
            .language
            .as_ref()
            .map_or_else(|| "0.1".into(), |item| item.value.clone()),
        version: file.version.as_ref().map(|item| item.value.clone()),
        description: file
            .description
            .iter()
            .map(|item| item.value.as_str())
            .collect::<Vec<_>>()
            .join("\n"),
        dependencies: file
            .dependencies
            .iter()
            .map(|item| item.target.value.clone())
            .collect(),
        classification: file
            .classification
            .as_ref()
            .map_or_default(|item| item.properties.clone()),
        goals: values(&file.goals),
        inputs: lower_inputs::lower(file),
        sources,
        events: lower_events::lower(file),
        process: file
            .process
            .iter()
            .map(|item| item.instruction.value.clone())
            .collect(),
        constraints: values(&file.constraints),
        expected: values(&file.expected),
        output: file
            .output
            .as_ref()
            .map_or_default(|item| item.properties.clone()),
        permissions,
    })
}

fn values(items: &[skillib_ast::Spanned<String>]) -> Vec<String> {
    items.iter().map(|item| item.value.clone()).collect()
}

trait MapOrDefault<T> {
    fn map_or_default(
        self,
        map: impl FnOnce(T) -> skillib_ast::PropertyMap,
    ) -> skillib_ast::PropertyMap;
}

impl<T> MapOrDefault<T> for Option<T> {
    fn map_or_default(
        self,
        map: impl FnOnce(T) -> skillib_ast::PropertyMap,
    ) -> skillib_ast::PropertyMap {
        self.map(map).unwrap_or_default()
    }
}
