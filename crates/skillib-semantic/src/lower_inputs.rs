use crate::SemanticInput;
use skillib_ast::SkillFile;
use std::collections::BTreeMap;

pub fn lower(file: &SkillFile) -> BTreeMap<String, SemanticInput> {
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
