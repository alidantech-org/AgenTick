use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AstValue {
    String(String),
    Boolean(bool),
    Number(i64),
    Array(Vec<AstValue>),
    Call(CallValue),
    Reference(String),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CallValue {
    pub name: String,
    pub arguments: Vec<AstValue>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct PropertyMap {
    pub values: BTreeMap<String, AstValue>,
}

impl PropertyMap {
    #[must_use]
    pub fn string(&self, key: &str) -> Option<&str> {
        match self.values.get(key) {
            Some(AstValue::String(value) | AstValue::Reference(value)) => Some(value),
            _ => None,
        }
    }

    #[must_use]
    pub fn boolean(&self, key: &str) -> Option<bool> {
        match self.values.get(key) {
            Some(AstValue::Boolean(value)) => Some(*value),
            _ => None,
        }
    }
}
