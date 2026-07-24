use console::{Style, style};
use std::path::Path;

pub fn heading(action: &str, path: Option<&Path>) {
    println!("\n{} Skillib {action}", Style::new().cyan().bold().apply_to("◆"));
    if let Some(path) = path {
        println!("{} {}", style("├─").dim(), path.display());
    }
}

pub fn info(message: impl std::fmt::Display) {
    println!("{} {message}", style("├─").dim());
}

pub fn success(message: impl std::fmt::Display) {
    println!("{} {message}", style("└─ ✓").green());
}

pub fn warning(message: impl std::fmt::Display) {
    println!("{} {message}", style("├─ !").yellow());
}

pub fn error(message: impl std::fmt::Display) {
    eprintln!("{} {message}", style("└─ ✗").red());
}

pub fn event(kind: &str, path: Option<&Path>, message: &str) {
    let symbol = if kind.ends_with("invalid") || kind.contains("failed") {
        style("├─ ✗").red()
    } else if kind.starts_with("protected") {
        style("├─ !").yellow()
    } else if kind.starts_with("skill.") {
        style("├─ ◆").cyan()
    } else {
        style("├─ •").dim()
    };
    let path = path.map_or_else(|| "-".to_owned(), |value| value.display().to_string());
    println!("{symbol} {kind:<24} {path}  {message}");
}
