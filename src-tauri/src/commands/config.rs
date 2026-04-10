use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub version: String,
    pub install_dir: String,
    pub mirror: String,
    pub current_version: Option<String>,
    pub proxy: Option<String>,
    pub npm_registry: String,
    pub auto_switch: bool,
    pub versions: HashMap<String, InstalledVersionInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledVersionInfo {
    pub path: String,
    pub installed_at: String,
    pub lts: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        let install_dir = dirs::home_dir()
            .map(|h| h.join(".nodeshift").to_string_lossy().to_string())
            .unwrap_or_else(|| "~/.nodeshift".to_string());

        Self {
            version: "0.1.4".to_string(),
            install_dir,
            mirror: "https://npmmirror.com/mirrors/node/".to_string(),
            current_version: None,
            proxy: None,
            npm_registry: "https://registry.npmmirror.com".to_string(),
            auto_switch: true,
            versions: HashMap::new(),
        }
    }
}

/// Get the config file path
fn config_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".nodeshift")
        .join("config.json")
}

/// Load config from file, or return default if file doesn't exist
pub fn load_config() -> Result<AppConfig> {
    let path = config_path();
    if path.exists() {
        let content = std::fs::read_to_string(&path)?;
        let config: AppConfig = serde_json::from_str(&content)?;
        Ok(config)
    } else {
        Ok(AppConfig::default())
    }
}

/// Save config to file
pub fn save_config_to_file(config: &AppConfig) -> Result<()> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let content = serde_json::to_string_pretty(config)?;
    std::fs::write(&path, content)?;
    Ok(())
}

/// Get application config (Tauri command)
#[tauri::command]
pub async fn get_config() -> Result<AppConfig, String> {
    load_config().map_err(|e| format!("Failed to load config: {}", e))
}

/// Save application config (Tauri command)
#[tauri::command]
pub async fn save_config(config: AppConfig) -> Result<(), String> {
    save_config_to_file(&config).map_err(|e| format!("Failed to save config: {}", e))
}
