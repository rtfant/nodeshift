//! NodeShift CLI Shim
//!
//! This shim intercepts `node`, `npm`, `npx` commands and:
//! 1. Checks for .nvmrc / .node-version in the current directory (walking up)
//! 2. If found, routes to the matching installed version
//! 3. Otherwise, routes to the default (current) version

use std::env;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode};

/// Version file names to search for, in priority order
const VERSION_FILES: &[&str] = &[".node-version", ".nvmrc"];

fn main() -> ExitCode {
    let args: Vec<String> = env::args().collect();
    let exe_name = Path::new(&args[0])
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("node")
        .to_string();

    // Determine the binary name (node, npm, npx)
    let bin_name = match exe_name.as_str() {
        "node" | "npm" | "npx" => exe_name.as_str(),
        _ => "node",
    };

    let nodeshift_dir = get_nodeshift_dir();
    let current_dir = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

    // Try to detect project-level version
    let target_version = detect_version(&current_dir);

    let real_binary = if let Some(version) = &target_version {
        // Use the project-specified version
        let version_dir = nodeshift_dir.join("versions").join(version);
        resolve_binary(&version_dir, bin_name)
    } else {
        // Use the default (current) version
        let current_dir = nodeshift_dir.join("current");
        resolve_binary(&current_dir, bin_name)
    };

    match real_binary {
        Some(binary_path) => {
            // Forward all arguments (skip argv[0])
            let status = Command::new(&binary_path)
                .args(&args[1..])
                .status();

            match status {
                Ok(s) => ExitCode::from(s.code().unwrap_or(1) as u8),
                Err(e) => {
                    eprintln!("nodeshift: failed to execute {}: {}", binary_path.display(), e);
                    ExitCode::from(1)
                }
            }
        }
        None => {
            if let Some(version) = &target_version {
                eprintln!(
                    "nodeshift: version {} is not installed. Run `nodeshift install {}`",
                    version, version
                );
            } else {
                eprintln!(
                    "nodeshift: no Node.js version is configured. Open NodeShift to install one."
                );
            }
            ExitCode::from(1)
        }
    }
}

/// Get the NodeShift root directory (~/.nodeshift)
fn get_nodeshift_dir() -> PathBuf {
    if let Ok(dir) = env::var("NODESHIFT_DIR") {
        return PathBuf::from(dir);
    }

    // Try reading from config
    let home = home_dir();
    let config_path = home.join(".nodeshift").join("config.json");
    if let Ok(content) = std::fs::read_to_string(&config_path) {
        if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(dir) = config.get("installDir").and_then(|v| v.as_str()) {
                let expanded = dir.replace("~", &home.to_string_lossy());
                return PathBuf::from(expanded);
            }
        }
    }

    home.join(".nodeshift")
}

/// Detect the project-level Node.js version by walking up directories
fn detect_version(start_dir: &Path) -> Option<String> {
    let mut current = start_dir.to_path_buf();

    loop {
        for filename in VERSION_FILES {
            let version_file = current.join(filename);
            if version_file.is_file() {
                if let Ok(content) = std::fs::read_to_string(&version_file) {
                    let trimmed = content.trim().to_string();
                    if !trimmed.is_empty() {
                        // Normalize: ensure version starts with 'v'
                        let version = if trimmed.starts_with('v') {
                            trimmed
                        } else if trimmed.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false) {
                            format!("v{}", trimmed)
                        } else {
                            // Could be "lts/*" or similar - skip for now
                            continue;
                        };
                        return Some(version);
                    }
                }
            }
        }

        if !current.pop() {
            break;
        }
    }

    None
}

/// Resolve the actual binary path for a given version directory
fn resolve_binary(version_dir: &Path, bin_name: &str) -> Option<PathBuf> {
    if !version_dir.exists() {
        return None;
    }

    // Unix: version_dir/bin/node
    let unix_path = version_dir.join("bin").join(bin_name);
    if unix_path.exists() {
        return Some(unix_path);
    }

    // Windows: version_dir/node.exe
    let win_path = version_dir.join(format!("{}.exe", bin_name));
    if win_path.exists() {
        return Some(win_path);
    }

    // Windows npm/npx might be .cmd files
    let cmd_path = version_dir.join(format!("{}.cmd", bin_name));
    if cmd_path.exists() {
        return Some(cmd_path);
    }

    None
}

/// Get the user's home directory
fn home_dir() -> PathBuf {
    if let Ok(home) = env::var("HOME") {
        return PathBuf::from(home);
    }
    if let Ok(home) = env::var("USERPROFILE") {
        return PathBuf::from(home);
    }
    PathBuf::from(".")
}
