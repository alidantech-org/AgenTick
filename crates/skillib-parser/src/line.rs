use skillib_source::Span;

#[derive(Debug, Clone)]
pub struct SourceLine {
    pub indent: usize,
    pub text: String,
    pub span: Span,
}

pub fn collect(text: &str) -> Vec<SourceLine> {
    let mut output = Vec::new();
    let mut offset = 0usize;
    for raw in text.split_inclusive('\n') {
        let body = raw.trim_end_matches(['\r', '\n']);
        let indent = body.chars().take_while(|value| *value == ' ').count();
        let trimmed = body.trim();
        if !trimmed.is_empty() && !trimmed.starts_with('#') {
            output.push(SourceLine {
                indent,
                text: trimmed.to_owned(),
                span: Span::new(offset + indent, offset + body.len()),
            });
        }
        offset += raw.len();
    }
    output
}
