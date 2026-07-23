use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use console::{Style, style};
use skillib_compiler::{Compiler, SkillCompiler};
use skillib_formatter::format_source;
use skillib_source::SourceFile;
use std::path::{Path, PathBuf};

#[derive(Parser)]
#[command(name = "skillib", version, about = "Skillib language and project toolchain")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Validate a `.sl` or `.skillib` source.
    Check { file: PathBuf, #[arg(long)] json: bool },
    /// Compile source into canonical Skill IR JSON.
    Compile { file: PathBuf, #[arg(short, long)] output: Option<PathBuf> },
    /// Canonically format source.
    Format { file: PathBuf, #[arg(long)] check: bool },
    /// Print parsed compiler information.
    Inspect { file: PathBuf },
    /// Watch a project and display events in this terminal.
    Watch { #[arg(default_value = ".")] root: PathBuf },
}

#[tokio::main]
async fn main() -> Result<()> {
    match Cli::parse().command {
        Command::Check { file, json } => check(&file, json),
        Command::Compile { file, output } => compile(&file, output.as_deref()),
        Command::Format { file, check } => format(&file, check),
        Command::Inspect { file } => inspect(&file),
        Command::Watch { root } => watch(&root).await,
    }
}

fn load(path: &Path) -> Result<SourceFile> {
    let text = std::fs::read_to_string(path)
        .with_context(|| format!("unable to read {}", path.display()))?;
    SourceFile::new(path.to_path_buf(), text).map_err(Into::into)
}

fn check(path: &Path, json: bool) -> Result<()> {
    heading("check", path);
    let result = SkillCompiler.compile(&load(path)?);
    if json {
        println!("{}", serde_json::to_string_pretty(&result)?);
    } else {
        for diagnostic in &result.diagnostics {
            println!("{} {}: {}", style("├─").dim(), diagnostic.code, diagnostic.message);
        }
        finish(result.success, result.ir_hash.as_deref());
    }
    anyhow::ensure!(result.success, "validation failed");
    Ok(())
}

fn compile(path: &Path, output: Option<&Path>) -> Result<()> {
    heading("compile", path);
    let result = SkillCompiler.compile(&load(path)?);
    anyhow::ensure!(result.success, "compilation failed");
    let json = serde_json::to_string_pretty(&result.ir)?;
    if let Some(target) = output {
        std::fs::write(target, &json)?;
        println!("{} wrote {}", style("└─ ✓").green(), target.display());
    } else {
        println!("{json}");
    }
    Ok(())
}

fn format(path: &Path, check_only: bool) -> Result<()> {
    heading("format", path);
    let source = load(path)?;
    let formatted = format_source(&source);
    if check_only {
        anyhow::ensure!(formatted == source.text(), "source is not formatted");
        finish(true, None);
    } else {
        std::fs::write(path, formatted)?;
        println!("{} formatted {}", style("└─ ✓").green(), path.display());
    }
    Ok(())
}

fn inspect(path: &Path) -> Result<()> {
    heading("inspect", path);
    let result = SkillCompiler.compile(&load(path)?);
    println!("{} source {}", style("├─").dim(), result.source_hash);
    println!("{} diagnostics {}", style("├─").dim(), result.diagnostics.len());
    finish(result.success, result.ir_hash.as_deref());
    Ok(())
}

async fn watch(root: &Path) -> Result<()> {
    heading("watch", root);
    let mut session = skillib_watcher::watch(root)?;
    println!("{} press Ctrl+C to stop", style("├─").dim());
    loop {
        tokio::select! {
            event = session.events.recv() => if let Some(event) = event {
                println!("{} {} {}", style("├─").cyan(), event.kind, event.path.map_or_else(|| "-".into(), |p| p.display().to_string()));
            },
            _ = tokio::signal::ctrl_c() => break,
        }
    }
    println!("{} watcher stopped", style("└─ ✓").green());
    Ok(())
}

fn heading(action: &str, path: &Path) {
    println!("\n{} Skillib {action}", Style::new().cyan().bold().apply_to("◆"));
    println!("{} {}", style("├─").dim(), path.display());
}

fn finish(success: bool, hash: Option<&str>) {
    let symbol = if success { style("└─ ✓").green() } else { style("└─ ✗").red() };
    println!("{symbol} {}", hash.unwrap_or(if success { "passed" } else { "failed" }));
}
