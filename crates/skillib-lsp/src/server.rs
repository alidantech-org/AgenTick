use crate::{Document, LanguageAnalysis, SkillibAnalysis, StdioTransport};
use serde_json::{Value, json};
use std::{
    collections::HashMap,
    io::{BufReader, BufWriter},
    path::PathBuf,
};

pub fn serve() -> anyhow::Result<()> {
    let stdin = std::io::stdin();
    let stdout = std::io::stdout();
    let mut transport = StdioTransport::new(
        BufReader::new(stdin.lock()),
        BufWriter::new(stdout.lock()),
    );
    let mut server = Server::default();
    while let Some(message) = transport.read_message()? {
        for response in server.handle(&message) {
            transport.write_message(&response)?;
        }
        if server.shutdown {
            break;
        }
    }
    Ok(())
}

#[derive(Default)]
struct Server {
    documents: HashMap<String, Document>,
    shutdown: bool,
}

impl Server {
    fn handle(&mut self, message: &Value) -> Vec<Value> {
        let method = message
            .get("method")
            .and_then(Value::as_str)
            .unwrap_or_default();
        let id = message.get("id");
        match method {
            "initialize" => vec![reply(id, &capabilities())],
            "initialized" => Vec::new(),
            "shutdown" => {
                self.shutdown = true;
                vec![reply(id, &Value::Null)]
            }
            "exit" => {
                self.shutdown = true;
                Vec::new()
            }
            "textDocument/didOpen" => self.did_open(message),
            "textDocument/didChange" => self.did_change(message),
            "textDocument/didClose" => self.did_close(message),
            "textDocument/completion" => vec![reply(id, &completions())],
            "textDocument/hover" => vec![reply(id, &hover())],
            "textDocument/documentSymbol" => vec![reply(id, &self.symbols(message))],
            "textDocument/formatting" => vec![reply(id, &self.formatting(message))],
            "textDocument/definition" => vec![reply(id, &Value::Null)],
            _ if id.is_some() => vec![error(id, -32601, "method not found")],
            _ => Vec::new(),
        }
    }

    fn did_open(&mut self, message: &Value) -> Vec<Value> {
        let item = &message["params"]["textDocument"];
        let uri = item["uri"].as_str().unwrap_or_default().to_owned();
        self.documents.insert(
            uri.clone(),
            Document {
                path: uri_path(&uri),
                version: version(item),
                text: item["text"].as_str().unwrap_or_default().to_owned(),
            },
        );
        vec![self.diagnostics(&uri)]
    }

    fn did_change(&mut self, message: &Value) -> Vec<Value> {
        let document = &message["params"]["textDocument"];
        let uri = document["uri"].as_str().unwrap_or_default().to_owned();
        let text = message["params"]["contentChanges"]
            .as_array()
            .and_then(|changes| changes.last())
            .and_then(|change| change["text"].as_str())
            .unwrap_or_default();
        if let Some(current) = self.documents.get_mut(&uri) {
            text.clone_into(&mut current.text);
            current.version = version(document);
        }
        vec![self.diagnostics(&uri)]
    }

    fn did_close(&mut self, message: &Value) -> Vec<Value> {
        let uri = message["params"]["textDocument"]["uri"]
            .as_str()
            .unwrap_or_default()
            .to_owned();
        self.documents.remove(&uri);
        vec![json!({
            "jsonrpc": "2.0",
            "method": "textDocument/publishDiagnostics",
            "params": {"uri": uri, "diagnostics": []},
        })]
    }

    fn diagnostics(&self, uri: &str) -> Value {
        let Some(document) = self.documents.get(uri) else {
            return json!({"jsonrpc":"2.0","method":"textDocument/publishDiagnostics","params":{"uri":uri,"diagnostics":[]}});
        };
        let diagnostics = SkillibAnalysis
            .analyze(document)
            .map(|result| {
                result
                    .diagnostics
                    .iter()
                    .map(|item| diagnostic_json(document, item))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        json!({"jsonrpc":"2.0","method":"textDocument/publishDiagnostics","params":{"uri":uri,"diagnostics":diagnostics}})
    }

    fn symbols(&self, message: &Value) -> Value {
        let uri = message["params"]["textDocument"]["uri"]
            .as_str()
            .unwrap_or_default();
        let Some(document) = self.documents.get(uri) else {
            return json!([]);
        };
        Value::Array(
            document
                .text
                .lines()
                .enumerate()
                .filter_map(|(line, text)| {
                    let name = text.trim_end_matches(':').trim();
                    (!text.starts_with(' ') && !name.is_empty()).then(|| {
                        json!({"name":name,"kind":3,"range":range(line,0,line,text.len()),"selectionRange":range(line,0,line,text.len())})
                    })
                })
                .collect(),
        )
    }

    fn formatting(&self, message: &Value) -> Value {
        let uri = message["params"]["textDocument"]["uri"]
            .as_str()
            .unwrap_or_default();
        let Some(document) = self.documents.get(uri) else {
            return json!([]);
        };
        let Ok(source) = skillib_source::SourceFile::new(
            document.path.clone(),
            document.text.clone(),
        ) else {
            return json!([]);
        };
        let text = skillib_formatter::format_source(&source);
        json!([{"range":range(0,0,document.text.lines().count()+1,0),"newText":text}])
    }
}

fn capabilities() -> Value {
    json!({"capabilities":{"textDocumentSync":1,"completionProvider":{},"hoverProvider":true,"documentSymbolProvider":true,"documentFormattingProvider":true,"definitionProvider":true}})
}

fn completions() -> Value {
    Value::Array(
        SkillibAnalysis
            .top_level_completions()
            .iter()
            .map(|label| json!({"label":label,"kind":14}))
            .collect(),
    )
}

fn hover() -> Value {
    json!({"contents":{"kind":"markdown","value":"Skillib declarative language. Use `skillib check` for compiler diagnostics."}})
}

fn diagnostic_json(
    document: &Document,
    item: &skillib_diagnostics::Diagnostic,
) -> Value {
    let (start_line, start_char) = offset_position(&document.text, item.span.start);
    let (end_line, end_char) = offset_position(&document.text, item.span.end);
    let severity = match item.severity {
        skillib_diagnostics::Severity::Error => 1,
        skillib_diagnostics::Severity::Warning => 2,
        skillib_diagnostics::Severity::Information => 3,
    };
    json!({"range":range(start_line,start_char,end_line,end_char),"severity":severity,"code":item.code,"source":"skillib","message":item.message})
}

fn version(value: &Value) -> i32 {
    value["version"]
        .as_i64()
        .and_then(|item| i32::try_from(item).ok())
        .unwrap_or_default()
}

fn offset_position(text: &str, offset: usize) -> (usize, usize) {
    let prefix = &text[..offset.min(text.len())];
    let line = prefix.bytes().filter(|byte| *byte == b'\n').count();
    let character = prefix
        .rsplit('\n')
        .next()
        .map(str::chars)
        .map(Iterator::count)
        .unwrap_or_default();
    (line, character)
}

fn range(sl: usize, sc: usize, el: usize, ec: usize) -> Value {
    json!({"start":{"line":sl,"character":sc},"end":{"line":el,"character":ec}})
}

fn uri_path(uri: &str) -> PathBuf {
    PathBuf::from(uri.strip_prefix("file://").unwrap_or(uri))
}

fn reply(id: Option<&Value>, result: &Value) -> Value {
    json!({"jsonrpc":"2.0","id":id,"result":result})
}

fn error(id: Option<&Value>, code: i64, message: &str) -> Value {
    json!({"jsonrpc":"2.0","id":id,"error":{"code":code,"message":message}})
}
