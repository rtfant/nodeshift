use crate::core::project_detect;
use serde::{Deserialize, Serialize};

/// Node.js version info from dist/index.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeVersion {
    pub version: String,
    pub date: String,
    pub files: Vec<String>,
    pub npm: Option<String>,
    pub v8: Option<String>,
    pub uv: Option<String>,
    pub zlib: Option<String>,
    pub openssl: Option<String>,
    pub modules: Option<String>,
    pub lts: LtsStatus,
    pub security: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum LtsStatus {
    Name(String),
    False(bool),
}

/// Fetch available Node.js versions from remote
#[tauri::command]
pub async fn fetch_versions() -> Result<Vec<NodeVersion>, String> {
    let url = "https://nodejs.org/dist/index.json";

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(url)
        .header("User-Agent", "NodeShift/0.1.0")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch versions: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let versions: Vec<NodeVersion> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse version data: {}", e))?;

    Ok(versions)
}

/// Get the currently active Node.js version
#[tauri::command]
pub async fn get_current_version() -> Result<Option<String>, String> {
    let config = crate::commands::config::load_config()
        .map_err(|e| format!("Failed to load config: {}", e))?;
    Ok(config.current_version)
}

/// Install a specific Node.js version
#[tauri::command]
pub async fn install_version(
    version: String,
    install_dir: String,
    mirror: String,
    lts_name: Option<String>,
) -> Result<(), String> {
    crate::core::version_manager::install_version(&version, &std::path::PathBuf::from(&install_dir), &mirror)
        .await
        .map_err(|e| format!("Install failed: {}", e))?;

    // Update config
    let mut config = crate::commands::config::load_config()
        .map_err(|e| format!("Failed to load config: {}", e))?;

    let version_path = std::path::PathBuf::from(&install_dir)
        .join("versions")
        .join(&version);

    config.versions.insert(
        version.clone(),
        crate::commands::config::InstalledVersionInfo {
            path: version_path.to_string_lossy().to_string(),
            installed_at: chrono::Utc::now().to_rfc3339(),
            lts: lts_name,
        },
    );

    // If this is the first installed version, set as current and configure PATH
    if config.current_version.is_none() {
        config.current_version = Some(version.clone());

        // Create symlink: current -> version
        let install_path = std::path::PathBuf::from(&install_dir);
        crate::core::version_manager::switch_version(&version, &install_path)
            .await
            .map_err(|e| format!("Failed to create version link: {}", e))?;

        // Configure system PATH (add nodeshift/current/bin to PATH)
        if let Err(e) = crate::core::env_config::configure_path(&install_path) {
            eprintln!("Warning: Failed to configure PATH: {}", e);
            // Don't fail the install - PATH can be configured manually
        }
    }

    crate::commands::config::save_config_to_file(&config)
        .map_err(|e| format!("Failed to save config: {}", e))?;

    Ok(())
}

/// Switch to a specific installed version
#[tauri::command]
pub async fn switch_version(version: String) -> Result<(), String> {
    let mut config = crate::commands::config::load_config()
        .map_err(|e| format!("Failed to load config: {}", e))?;

    if !config.versions.contains_key(&version) {
        return Err(format!("Version {} is not installed", version));
    }

    let install_dir = std::path::PathBuf::from(&config.install_dir);
    crate::core::version_manager::switch_version(&version, &install_dir)
        .await
        .map_err(|e| format!("Switch failed: {}", e))?;

    config.current_version = Some(version);
    crate::commands::config::save_config_to_file(&config)
        .map_err(|e| format!("Failed to save config: {}", e))?;

    Ok(())
}

/// Uninstall a specific version
#[tauri::command]
pub async fn uninstall_version(version: String) -> Result<(), String> {
    let mut config = crate::commands::config::load_config()
        .map_err(|e| format!("Failed to load config: {}", e))?;

    let install_dir = std::path::PathBuf::from(&config.install_dir);
    crate::core::version_manager::uninstall_version(&version, &install_dir)
        .await
        .map_err(|e| format!("Uninstall failed: {}", e))?;

    let was_active = config.current_version.as_deref() == Some(version.as_str());
    config.versions.remove(&version);

    if was_active {
        // Switch to another installed version, or clear current
        if let Some(next_version) = config.versions.keys().next().cloned() {
            config.current_version = Some(next_version.clone());
            // Update symlink to point to the next version
            let _ = crate::core::version_manager::switch_version(&next_version, &install_dir).await;
        } else {
            config.current_version = None;
            // Remove the current symlink since no versions remain
            let current_link = install_dir.join("current");
            if current_link.exists() || current_link.is_symlink() {
                let _ = std::fs::remove_file(&current_link)
                    .or_else(|_| std::fs::remove_dir(&current_link));
            }
            // Remove PATH config since no versions are installed
            let _ = crate::core::env_config::remove_path(&install_dir);
        }
    }

    crate::commands::config::save_config_to_file(&config)
        .map_err(|e| format!("Failed to save config: {}", e))?;

    Ok(())
}

/// Detect project-level Node.js version from .nvmrc / .node-version
#[tauri::command]
pub async fn detect_project_version(
    dir: String,
) -> Result<Option<project_detect::ProjectVersionInfo>, String> {
    let path = std::path::PathBuf::from(&dir);
    project_detect::get_project_version_info(&path)
        .map_err(|e| format!("Failed to detect project version: {}", e))
}
