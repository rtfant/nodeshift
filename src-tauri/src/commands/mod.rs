pub mod cache;
pub mod config;
pub mod system;
pub mod version;

/// IPC test command
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! NodeShift IPC is working.", name)
}
