use crate::SemanticEvent;
use skillib_ast::SkillFile;

pub fn lower(file: &SkillFile) -> Vec<SemanticEvent> {
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
