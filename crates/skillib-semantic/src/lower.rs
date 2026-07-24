use crate::{SemanticEvent, SemanticInput, SemanticSkill, SemanticSource};
use skillib_ast::{AstValue, SkillFile};
use std::collections::{BTreeMap, BTreeSet};

pub fn lower(file: &SkillFile) -> Option<SemanticSkill> {
    let identity = file.identity.as_ref()?.value.clone();
    let (sources, permissions) = lower_sources(file);
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
        inputs: lower_inputs(file),
        sources,
        events: lower_events(file),
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

fn lower_inputs(file: &SkillFile) -> BTreeMap<String, SemanticInput> {
    file.inputs
        .iter()
        .map(|input| {
            let kind = input
                .properties
                .string("type")
                .unwrap_or("string")
                .to_owned();
            let required = input.properties.boolean("required").unwrap_or(false);
            let default = input.properties.values.get("default").cloned();
            (
                input.name.value.clone(),
                SemanticInput {
                    kind,
                    required,
                    default,
                },
            )
        })
        .collect()
}

fn lower_sources(
    file: &SkillFile,
) -> (BTreeMap<String, SemanticSource>, BTreeSet<String>) {
    let mut permissions = BTreeSet::new();
    let sources = file
        .sources
        .iter()
        .map(|source| {
            let (provider, arguments) = source
                .properties
                .values
                .get("from")
                .and_then(call_parts)
                .unwrap_or_else(|| ("unknown".into(), Vec::new()));
            infer_permission(&provider, &mut permissions);
            let required = source.properties.boolean("required").unwrap_or(false);
            let trust = source
                .properties
                .string("trust")
                .unwrap_or("untrusted")
                .to_owned();
            let resolution = source
                .properties
                .string("resolution")
                .unwrap_or("runtime")
                .to_owned();
            (
                source.name.value.clone(),
                SemanticSource {
                    provider,
                    arguments,
                    required,
                    trust,
                    resolution,
                },
            )
        })
        .collect();
    (sources, permissions)
}

fn lower_events(file: &SkillFile) -> Vec<SemanticEvent> {
    file.events
        .iter()
        .map(|event| SemanticEvent {
            name: event.name.value.clone(),
            condition: event.properties.string("when").map(str::to_owned),
            priority: event.properties.string("priority").map(str::to_owned),
            tone: event.properties.string("tone").map(str::to_owned),
            avoid: event
                .avoid
                .iter()
                .map(|item| item.value.clone())
                .collect(),
        })
        .collect()
}

fn values(items: &[skillib_ast::Spanned<String>]) -> Vec<String> {
    items.iter().map(|item| item.value.clone()).collect()
}

fn call_parts(value: &AstValue) -> Option<(String, Vec<AstValue>)> {
    match value {
        AstValue::Call(call) => Some((call.name.clone(), call.arguments.clone())),
        _ => None,
    }
}

fn infer_permission(provider: &str, output: &mut BTreeSet<String>) {
    let permission = match provider {
        "file" | "workspace" => Some("filesystem.read"),
        "url" => Some("network.http"),
        "skill" => Some("registry.read"),
        _ => None,
    };
    if let Some(permission) = permission {
        output.insert(permission.to_owned());
    }
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
