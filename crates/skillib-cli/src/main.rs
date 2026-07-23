mod args;
mod language;
mod project;
mod registry_cmd;
mod ui;
mod update_cmd;
mod watch_cmd;

use anyhow::Result;
use args::{Cli, Command};
use clap::Parser;

#[tokio::main]
async fn main() -> Result<()> {
    let root = std::env::current_dir()?;
    match Cli::parse().command {
        Command::Init => project::init(&root),
        Command::New { name, extension } => {
            let path = language::new_skill(&name, &extension)?;
            ui::success(format!("created {}", path.display()));
            Ok(())
        }
        Command::Check { file, json } => language::check(&file, json),
        Command::Compile { file, output } => language::compile(&file, output.as_deref()),
        Command::Format { file, check } => language::format(&file, check),
        Command::Inspect { file } => language::inspect(&file),
        Command::Watch { root } => watch_cmd::run(&root).await,
        Command::Verify { root } => project::verify(&root),
        Command::History { root, limit } => project::history(&root, limit),
        Command::Status { root } => project::status(&root),
        Command::Login { token } => registry_cmd::login(&root, token).await,
        Command::Logout => registry_cmd::logout(&root),
        Command::Whoami => registry_cmd::whoami(&root).await,
        Command::Search { query } => registry_cmd::search(&query).await,
        Command::Install { package, selector } => registry_cmd::install(&root, &package, &selector).await,
        Command::Update { package } => update_cmd::run(&root, package.as_deref()).await,
        Command::Remove { package } => registry_cmd::remove(&root, &package),
        Command::Publish { file, package, visibility } => registry_cmd::publish(&root, &file, &package, &visibility).await,
        Command::Lsp => skillib_lsp::serve(),
    }
}
