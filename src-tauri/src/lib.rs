mod commands;
mod core;
mod platform;

use commands::greet;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::version::fetch_versions,
            commands::version::get_current_version,
            commands::version::install_version,
            commands::version::switch_version,
            commands::version::uninstall_version,
            commands::config::get_config,
            commands::config::save_config,
            commands::system::get_system_info,
            commands::version::detect_project_version,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
