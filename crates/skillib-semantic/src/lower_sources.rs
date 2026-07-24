use crate::SemanticSource;
use skillib_ast::{AstValue, SkillFile};
use std::collections::{BTreeMap, BTreeSet};

pub fn lower(
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
