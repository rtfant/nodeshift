//! Project-level version detection (.nvmrc / .node-version)
//!
//! Walks up the directory tree from a given path to find version pinning files.

use anyhow::Result;
use std::path::Path;

/// Version file names to search for, in priority order
const VERSION_FILES: &[&str] = &[".node-version", ".nvmrc"];

/// Detect project-level Node.js version requirement.
/// Walks up from the given directory to find .nvmrc or .node-version.
/// Returns the version string (e.g. "v22.15.0" or "22.15.0") if found.
pub fn detect_project_version(dir: &Path) -> Result<Option<String>> {
    let mut current = dir.to_path_buf();

    loop {
        for filename in VERSION_FILES {
            let version_file = current.join(filename);
            if version_file.is_file() {
                let content = std::fs::read_to_string(&version_file)?;
                let version = parse_version_string(&content);
                if let Some(v) = version {
                    return Ok(Some(v));
                }
            }
        }

        // Also check package.json engines.node
        let pkg_json = current.join("package.json");
        if pkg_json.is_file() {
            if let Ok(content) = std::fs::read_to_string(&pkg_json) {
                if let Ok(pkg) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(engines) = pkg.get("engines") {
                        if let Some(node_range) = engines.get("node").and_then(|v| v.as_str()) {
                            // Return raw range string - caller can decide how to handle semver
                            return Ok(Some(node_range.to_string()));
                        }
                    }
                }
            }
        }

        if !current.pop() {
            break;
        }
    }

    Ok(None)
}

/// Parse a version string from file content.
/// Handles formats like "v22.15.0", "22.15.0", "lts/jod", "lts/*"
fn parse_version_string(content: &str) -> Option<String> {
    let trimmed = content.trim();
    if trimmed.is_empty() {
        return None;
    }

    // Normalize: remove leading 'v' for consistency, then add it back
    let version = trimmed.to_string();

    // Filter out obviously invalid content
    if version.contains('\n') || version.len() > 50 {
        return None;
    }

    Some(version)
}

/// Get info about the detected project version for display in the UI
pub fn get_project_version_info(dir: &Path) -> Result<Option<ProjectVersionInfo>> {
    let mut current = dir.to_path_buf();

    loop {
        for filename in VERSION_FILES {
            let version_file = current.join(filename);
            if version_file.is_file() {
                let content = std::fs::read_to_string(&version_file)?;
                let version = parse_version_string(&content);
                if let Some(v) = version {
                    return Ok(Some(ProjectVersionInfo {
                        version: v,
                        source_file: filename.to_string(),
                        source_dir: current.to_string_lossy().to_string(),
                    }));
                }
            }
        }

        if !current.pop() {
            break;
        }
    }

    Ok(None)
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectVersionInfo {
    pub version: String,
    pub source_file: String,
    pub source_dir: String,
}
