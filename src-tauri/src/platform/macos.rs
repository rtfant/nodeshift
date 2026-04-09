//! macOS-specific operations
//!
//! - PATH: append export to ~/.zshrc (default shell on modern macOS)
//! - Version link: symlink (ln -sfn)

use super::PlatformOps;
use anyhow::{Context, Result};
use std::path::PathBuf;

pub struct MacOSPlatform;

impl MacOSPlatform {
    pub fn add_to_path(nodeshift_dir: &std::path::Path) -> Result<()> {
        let current_bin = nodeshift_dir.join("current").join("bin");
        let bin_str = current_bin.to_string_lossy().to_string();

        let shell = crate::core::env_config::detect_shell();
        if let Some(config_path) = crate::core::env_config::shell_config_path(&shell) {
            crate::core::env_config::add_path_to_shell_config(&config_path, &bin_str)?;
        }

        // Also try .zshrc specifically since macOS defaults to zsh
        if shell != "zsh" {
            if let Some(home) = dirs::home_dir() {
                let zshrc = home.join(".zshrc");
                crate::core::env_config::add_path_to_shell_config(&zshrc, &bin_str)?;
            }
        }

        Ok(())
    }

    pub fn remove_from_path(_nodeshift_dir: &std::path::Path) -> Result<()> {
        let shell = crate::core::env_config::detect_shell();
        if let Some(config_path) = crate::core::env_config::shell_config_path(&shell) {
            crate::core::env_config::remove_path_from_shell_config(&config_path)?;
        }

        if shell != "zsh" {
            if let Some(home) = dirs::home_dir() {
                let zshrc = home.join(".zshrc");
                crate::core::env_config::remove_path_from_shell_config(&zshrc)?;
            }
        }

        Ok(())
    }
}

impl PlatformOps for MacOSPlatform {
    fn add_to_path(nodeshift_dir: &PathBuf) -> Result<()> {
        MacOSPlatform::add_to_path(nodeshift_dir)
    }

    fn remove_from_path(nodeshift_dir: &PathBuf) -> Result<()> {
        MacOSPlatform::remove_from_path(nodeshift_dir)
    }

    fn create_version_link(current_dir: &PathBuf, target_dir: &PathBuf) -> Result<()> {
        if current_dir.exists() || current_dir.is_symlink() {
            std::fs::remove_file(current_dir)
                .or_else(|_| std::fs::remove_dir(current_dir))
                .context("Failed to remove existing symlink")?;
        }
        std::os::unix::fs::symlink(target_dir, current_dir)
            .context("Failed to create symlink")?;
        Ok(())
    }

    fn remove_version_link(current_dir: &PathBuf) -> Result<()> {
        if current_dir.exists() || current_dir.is_symlink() {
            std::fs::remove_file(current_dir)
                .or_else(|_| std::fs::remove_dir(current_dir))
                .context("Failed to remove symlink")?;
        }
        Ok(())
    }

    fn archive_extension() -> &'static str {
        "tar.xz"
    }

    fn node_platform() -> &'static str {
        "darwin"
    }

    fn node_arch() -> &'static str {
        if cfg!(target_arch = "aarch64") {
            "arm64"
        } else {
            "x64"
        }
    }
}
