//! Environment variable configuration (PATH management)
//! Delegates to platform-specific implementations

use anyhow::Result;
use std::path::Path;

/// The marker comment used to identify NodeShift PATH entries in shell configs
const NODESHIFT_MARKER: &str = "# Added by NodeShift";

/// Configure system PATH to include the NodeShift current/bin directory
pub fn configure_path(nodeshift_dir: &Path) -> Result<()> {
    #[cfg(target_os = "windows")]
    {
        crate::platform::windows::WindowsPlatform::add_to_path(nodeshift_dir)
    }
    #[cfg(target_os = "macos")]
    {
        crate::platform::macos::MacOSPlatform::add_to_path(nodeshift_dir)
    }
    #[cfg(target_os = "linux")]
    {
        crate::platform::linux::LinuxPlatform::add_to_path(nodeshift_dir)
    }
}

/// Remove NodeShift from system PATH
pub fn remove_path(nodeshift_dir: &Path) -> Result<()> {
    #[cfg(target_os = "windows")]
    {
        crate::platform::windows::WindowsPlatform::remove_from_path(nodeshift_dir)
    }
    #[cfg(target_os = "macos")]
    {
        crate::platform::macos::MacOSPlatform::remove_from_path(nodeshift_dir)
    }
    #[cfg(target_os = "linux")]
    {
        crate::platform::linux::LinuxPlatform::remove_from_path(nodeshift_dir)
    }
}

/// Create a symlink/junction from current -> target version
#[allow(dead_code)]
pub fn create_version_link(nodeshift_dir: &Path, version: &str) -> Result<()> {
    let current_link = nodeshift_dir.join("current");
    let target = nodeshift_dir.join("versions").join(version);

    #[cfg(target_os = "windows")]
    {
        use crate::platform::PlatformOps;
        crate::platform::windows::WindowsPlatform::create_version_link(&current_link, &target)
    }
    #[cfg(target_os = "macos")]
    {
        use crate::platform::PlatformOps;
        crate::platform::macos::MacOSPlatform::create_version_link(&current_link, &target)
    }
    #[cfg(target_os = "linux")]
    {
        use crate::platform::PlatformOps;
        crate::platform::linux::LinuxPlatform::create_version_link(&current_link, &target)
    }
}

/// Detect the current user's shell type
pub fn detect_shell() -> String {
    if let Ok(shell) = std::env::var("SHELL") {
        if shell.contains("zsh") {
            return "zsh".to_string();
        } else if shell.contains("fish") {
            return "fish".to_string();
        } else if shell.contains("bash") {
            return "bash".to_string();
        }
    }
    "bash".to_string() // default
}

/// Get the shell configuration file path for the detected shell
pub fn shell_config_path(shell: &str) -> Option<std::path::PathBuf> {
    let home = dirs::home_dir()?;
    match shell {
        "zsh" => Some(home.join(".zshrc")),
        "bash" => {
            let bashrc = home.join(".bashrc");
            let profile = home.join(".bash_profile");
            if bashrc.exists() {
                Some(bashrc)
            } else {
                Some(profile)
            }
        }
        "fish" => Some(home.join(".config").join("fish").join("config.fish")),
        _ => Some(home.join(".bashrc")),
    }
}

/// Add NodeShift PATH export to a shell config file (Unix)
pub fn add_path_to_shell_config(config_path: &Path, nodeshift_bin: &str) -> Result<()> {
    let content = if config_path.exists() {
        std::fs::read_to_string(config_path)?
    } else {
        String::new()
    };

    // Check if already added
    if content.contains(NODESHIFT_MARKER) {
        return Ok(());
    }

    let shell_name = config_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    let export_line = if shell_name.contains("fish") {
        format!(
            "\n{}\nset -gx PATH \"{}\" $PATH\n",
            NODESHIFT_MARKER, nodeshift_bin
        )
    } else {
        format!(
            "\n{}\nexport PATH=\"{}:$PATH\"\n",
            NODESHIFT_MARKER, nodeshift_bin
        )
    };

    // Create parent dirs if needed (for fish config)
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(config_path)?;

    use std::io::Write;
    file.write_all(export_line.as_bytes())?;

    Ok(())
}

/// Remove NodeShift PATH export from a shell config file (Unix)
pub fn remove_path_from_shell_config(config_path: &Path) -> Result<()> {
    if !config_path.exists() {
        return Ok(());
    }

    let content = std::fs::read_to_string(config_path)?;
    let mut new_lines: Vec<&str> = Vec::new();
    let mut skip_next = false;

    for line in content.lines() {
        if line.trim() == NODESHIFT_MARKER {
            skip_next = true;
            continue;
        }
        if skip_next {
            skip_next = false;
            continue;
        }
        new_lines.push(line);
    }

    std::fs::write(config_path, new_lines.join("\n"))?;
    Ok(())
}
