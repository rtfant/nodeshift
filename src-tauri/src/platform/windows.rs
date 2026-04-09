//! Windows-specific operations
//!
//! - PATH: modify via Registry (HKCU\Environment\Path)
//! - Version link: directory junction (mklink /J)
//! - Broadcast: WM_SETTINGCHANGE after PATH modification

use super::PlatformOps;
use anyhow::{Context, Result};
use std::path::PathBuf;

pub struct WindowsPlatform;

impl WindowsPlatform {
    /// Add NodeShift's current directory to user PATH via registry
    pub fn add_to_path(nodeshift_dir: &std::path::Path) -> Result<()> {
        #[cfg(target_os = "windows")]
        {
            use winreg::enums::*;
            use winreg::RegKey;

            let current_bin = nodeshift_dir.join("current").to_string_lossy().to_string();

            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            let env = hkcu.open_subkey_with_flags("Environment", KEY_READ | KEY_WRITE)?;

            let current_path: String = env.get_value("Path").unwrap_or_default();

            // Check if already in PATH
            if current_path
                .split(';')
                .any(|p| p.trim().eq_ignore_ascii_case(&current_bin))
            {
                return Ok(());
            }

            // Check PATH length limit
            let new_path = if current_path.is_empty() {
                current_bin.clone()
            } else {
                format!("{};{}", current_bin, current_path)
            };

            if new_path.len() > 2048 {
                anyhow::bail!(
                    "PATH would exceed 2048 characters ({} chars). Please clean up your PATH first.",
                    new_path.len()
                );
            }

            env.set_value("Path", &new_path)?;

            // Broadcast WM_SETTINGCHANGE to notify other processes
            broadcast_settings_change();
        }
        Ok(())
    }

    /// Remove NodeShift from user PATH via registry
    pub fn remove_from_path(nodeshift_dir: &std::path::Path) -> Result<()> {
        #[cfg(target_os = "windows")]
        {
            use winreg::enums::*;
            use winreg::RegKey;

            let current_bin = nodeshift_dir.join("current").to_string_lossy().to_string();

            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            let env = hkcu.open_subkey_with_flags("Environment", KEY_READ | KEY_WRITE)?;

            let current_path: String = env.get_value("Path").unwrap_or_default();

            let new_path: String = current_path
                .split(';')
                .filter(|p| !p.trim().eq_ignore_ascii_case(&current_bin))
                .collect::<Vec<_>>()
                .join(";");

            env.set_value("Path", &new_path)?;
            broadcast_settings_change();
        }
        Ok(())
    }
}

impl PlatformOps for WindowsPlatform {
    fn add_to_path(nodeshift_dir: &PathBuf) -> Result<()> {
        WindowsPlatform::add_to_path(nodeshift_dir)
    }

    fn remove_from_path(nodeshift_dir: &PathBuf) -> Result<()> {
        WindowsPlatform::remove_from_path(nodeshift_dir)
    }

    fn create_version_link(current_dir: &PathBuf, target_dir: &PathBuf) -> Result<()> {
        // Remove existing junction if present
        if current_dir.exists() {
            std::fs::remove_dir(current_dir)
                .or_else(|_| std::fs::remove_file(current_dir))
                .context("Failed to remove existing version link")?;
        }

        // Create junction point using cmd /C mklink /J
        #[cfg(target_os = "windows")]
        {
            let output = std::process::Command::new("cmd")
                .args([
                    "/C",
                    "mklink",
                    "/J",
                    &current_dir.to_string_lossy(),
                    &target_dir.to_string_lossy(),
                ])
                .output()?;

            if !output.status.success() {
                // Fallback: try symlink_dir (requires developer mode or elevated)
                std::os::windows::fs::symlink_dir(target_dir, current_dir)
                    .context("Failed to create directory junction")?;
            }
        }
        Ok(())
    }

    fn remove_version_link(current_dir: &PathBuf) -> Result<()> {
        if current_dir.exists() {
            std::fs::remove_dir(current_dir)
                .or_else(|_| std::fs::remove_file(current_dir))
                .context("Failed to remove version link")?;
        }
        Ok(())
    }

    fn archive_extension() -> &'static str {
        "zip"
    }

    fn node_platform() -> &'static str {
        "win"
    }

    fn node_arch() -> &'static str {
        if cfg!(target_arch = "x86_64") {
            "x64"
        } else if cfg!(target_arch = "aarch64") {
            "arm64"
        } else {
            "x64"
        }
    }
}

/// Broadcast WM_SETTINGCHANGE to notify running applications of environment change
#[cfg(target_os = "windows")]
fn broadcast_settings_change() {
    use std::ffi::CString;
    unsafe {
        let env_str = CString::new("Environment").unwrap();
        // HWND_BROADCAST = 0xFFFF, WM_SETTINGCHANGE = 0x001A
        winapi::um::winuser::SendMessageTimeoutA(
            winapi::um::winuser::HWND_BROADCAST,
            winapi::um::winuser::WM_SETTINGCHANGE,
            0,
            env_str.as_ptr() as _,
            winapi::um::winuser::SMTO_ABORTIFHUNG,
            5000,
            std::ptr::null_mut(),
        );
    }
}

#[cfg(not(target_os = "windows"))]
fn broadcast_settings_change() {
    // No-op on non-Windows
}
