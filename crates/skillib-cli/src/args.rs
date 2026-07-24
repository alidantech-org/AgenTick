use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "skillib", version, about = "Skillib language and project toolchain")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand)]
pub enum Command {
    Init,
    New { name: String, #[arg(long, default_value = ".skillib")] extension: String },
    Check { file: PathBuf, #[arg(long)] json: bool },
    Compile { file: PathBuf, #[arg(short, long)] output: Option<PathBuf> },
    Format { file: PathBuf, #[arg(long)] check: bool },
    Inspect { file: PathBuf },
    Watch { #[arg(default_value = ".")] root: PathBuf },
    Verify { #[arg(default_value = ".")] root: PathBuf },
    History { #[arg(default_value = ".")] root: PathBuf, #[arg(long, default_value_t = 20)] limit: usize },
    Status { #[arg(default_value = ".")] root: PathBuf },
    Login { #[arg(long)] token: Option<String> },
    Logout,
    Whoami,
    Search { query: String },
    Install { package: String, #[arg(default_value = "latest")] selector: String },
    Update { package: Option<String> },
    Remove { package: String },
    Publish {
        file: PathBuf,
        #[arg(long)] package: String,
        #[arg(long, default_value = "public")] visibility: String,
    },
    Lsp,
}
