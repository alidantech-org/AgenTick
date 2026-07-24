use crate::ui;
use anyhow::Result;
use std::path::Path;

pub async fn run(root: &Path) -> Result<()> {
    ui::heading("watch", Some(root));
    let mut session = skillib_watcher::watch(root)?;
    ui::info(format!("session {}", session.session_id));
    ui::info("watching recursively; press Ctrl+C to stop");
    loop {
        tokio::select! {
            event = session.events.recv() => {
                if let Some(event) = event {
                    ui::event(&event.kind, event.path.as_deref(), &event.message);
                } else {
                    break;
                }
            },
            result = tokio::signal::ctrl_c() => {
                result?;
                break;
            },
        }
    }
    ui::success("watcher stopped");
    Ok(())
}
