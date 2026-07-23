use crate::{language, ui};
use anyhow::Result;
use skillib_source::is_skillib_path;
use skillib_watcher::HistoryStore;
use std::path::{Path, PathBuf};

pub fn init(root: &Path) -> Result<()> {
    ui::heading("init", Some(root));
    let agents = root.join("agents");
    std::fs::create_dir_all(agents.join("work/history"))?;
    std::fs::create_dir_all(agents.join("skills"))?;
    write_once(&agents.join("README.md"), "# Project AI Instructions\n\nThis folder defines how AI must work in this repository.\n")?;
    write_once(&agents.join("INSTRUCTIONS.md"), "# Instructions\n\nRead this folder before changing project files. Skillib watch records project changes.\n")?;
    write_once(&agents.join("ARCHITECTURE.md"), "# Architecture\n\nDescribe the project architecture and invariants here.\n")?;
    write_once(&agents.join("skillib-watch.json"), "{\n  \"debounce_ms\": 120,\n  \"ignores\": [\"/.git/\", \"/node_modules/\", \"/target/\", \"/.next/\", \"/dist/\", \"/agents/.skillib/\"],\n  \"protected\": [\"agents/rules/\", \"agents/architecture/\", \"agents/templates/\"]\n}\n")?;
    append_gitignore(root)?;
    ui::success("agents/ initialized; existing files preserved");
    Ok(())
}

pub fn verify(root: &Path) -> Result<()> {
    ui::heading("verify", Some(root));
    anyhow::ensure!(root.join("agents").is_dir(), "agents/ is missing");
    let files = collect(root)?;
    anyhow::ensure!(!files.is_empty(), "no .sl or .skillib files found");
    let mut failed = 0usize;
    for file in files {
        if let Err(error) = language::check(&file, false) {
            failed += 1;
            ui::warning(format!("{}: {error}", file.display()));
        }
    }
    anyhow::ensure!(failed == 0, "{failed} skill file(s) failed");
    ui::success("project verified");
    Ok(())
}

pub fn history(root: &Path, limit: usize) -> Result<()> {
    ui::heading("history", Some(root));
    let events = HistoryStore::project(root).recent(limit)?;
    for event in events {
        ui::event(&event.kind, event.path.as_deref(), &event.message);
    }
    ui::success("history loaded");
    Ok(())
}

pub fn status(root: &Path) -> Result<()> {
    ui::heading("status", Some(root));
    ui::info(format!("agents       {}", root.join("agents").is_dir()));
    ui::info(format!("skill files  {}", collect(root)?.len()));
    ui::info(format!("events       {}", HistoryStore::project(root).recent(usize::MAX)?.len()));
    ui::success("status complete");
    Ok(())
}

fn write_once(path: &Path, content: &str) -> Result<()> {
    if !path.exists() { std::fs::write(path, content)?; }
    Ok(())
}

fn append_gitignore(root: &Path) -> Result<()> {
    let path = root.join(".gitignore");
    let mut content = std::fs::read_to_string(&path).unwrap_or_default();
    if !content.contains("agents/.skillib/") {
        content.push_str("\n# Skillib managed state\nagents/.skillib/\n");
        std::fs::write(path, content)?;
    }
    Ok(())
}

fn collect(root: &Path) -> Result<Vec<PathBuf>> {
    let mut output = Vec::new();
    visit(root, &mut output)?;
    Ok(output)
}

fn visit(path: &Path, output: &mut Vec<PathBuf>) -> Result<()> {
    for entry in std::fs::read_dir(path)? {
        let path = entry?.path();
        if path.is_dir() && !matches!(path.file_name().and_then(|v| v.to_str()), Some(".git" | "node_modules" | "target" | ".next")) { visit(&path, output)?; }
        else if is_skillib_path(&path) { output.push(path); }
    }
    Ok(())
}
