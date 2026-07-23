//! Canonical formatting for `.sl` and `.skillib` files.

use skillib_source::SourceFile;

/// Formats a Skillib source using four-space indentation and one final newline.
#[must_use]
pub fn format_source(source: &SourceFile) -> String {
    let mut output = String::new();
    let mut previous_blank = false;

    for raw in source.text().lines() {
        let trimmed_end = raw.trim_end();
        let trimmed = trimmed_end.trim_start();
        if trimmed.is_empty() {
            if !previous_blank && !output.is_empty() {
                output.push('\n');
            }
            previous_blank = true;
            continue;
        }
        previous_blank = false;
        let spaces = trimmed_end.len() - trimmed.len();
        let depth = spaces.div_ceil(4);
        output.push_str(&"    ".repeat(depth));
        output.push_str(trimmed);
        output.push('\n');
    }

    if output.is_empty() {
        output.push('\n');
    }
    output
}
