use crate::ui;
use anyhow::{Context, Result};
use skillib_compiler::{Compiler, SkillCompiler};
use skillib_formatter::format_source;
use skillib_source::SourceFile;
use std::path::{Path, PathBuf};

pub fn load(path: &Path) -> Result<SourceFile> {
    let text = std::fs::read_to_string(path)
        .with_context(|| format!("unable to read {}", path.display()))?;
    SourceFile::new(path.to_path_buf(), text).map_err(Into::into)
}

pub fn check(path: &Path, json: bool) -> Result<()> {
    ui::heading("check", Some(path));
    let result = SkillCompiler.compile(&load(path)?);
    if json {
        println!("{}", serde_json::to_string_pretty(&result)?);
    } else {
        for diagnostic in &result.diagnostics {
            ui::info(format!("{}: {}", diagnostic.code, diagnostic.message));
        }
        if result.success { ui::success(result.ir_hash.as_deref().unwrap_or("passed")); }
        else { ui::error("validation failed"); }
    }
    anyhow::ensure!(result.success, "validation failed");
    Ok(())
}

pub fn compile(path: &Path, output: Option<&Path>) -> Result<()> {
    ui::heading("compile", Some(path));
    let result = SkillCompiler.compile(&load(path)?);
    anyhow::ensure!(result.success, "compilation failed");
    let json = serde_json::to_string_pretty(&result.ir)?;
    if let Some(target) = output {
        std::fs::write(target, json)?;
        ui::success(format!("wrote {}", target.display()));
    } else {
        println!("{json}");
    }
    Ok(())
}

pub fn format(path: &Path, check_only: bool) -> Result<()> {
    ui::heading("format", Some(path));
    let source = load(path)?;
    let formatted = format_source(&source);
    if check_only {
        anyhow::ensure!(formatted == source.text(), "source is not formatted");
        ui::success("formatted");
    } else {
        std::fs::write(path, formatted)?;
        ui::success(format!("formatted {}", path.display()));
    }
    Ok(())
}

pub fn inspect(path: &Path) -> Result<()> {
    ui::heading("inspect", Some(path));
    let result = SkillCompiler.compile(&load(path)?);
    ui::info(format!("source hash  {}", result.source_hash));
    ui::info(format!("IR hash      {}", result.ir_hash.as_deref().unwrap_or("-")));
    ui::info(format!("diagnostics  {}", result.diagnostics.len()));
    anyhow::ensure!(result.success, "inspection found errors");
    ui::success("valid");
    Ok(())
}

pub fn new_skill(name: &str, extension: &str) -> Result<PathBuf> {
    let extension = match extension { ".sl" | "sl" => "sl", _ => "skillib" };
    let path = PathBuf::from(format!("{name}.{extension}"));
    anyhow::ensure!(!path.exists(), "{} already exists", path.display());
    let source = format!("define {name}\nlanguage \"0.1\"\n\ndescription:\n    Describe this skill.\n\ngoal:\n    - Define the intended result.\n\nprocess:\n    1. Inspect the required context.\n    2. Produce the expected result.\n\nconstraints:\n    - Do not invent evidence.\n\nexpected:\n    - Result\n");
    std::fs::write(&path, source)?;
    Ok(path)
}
