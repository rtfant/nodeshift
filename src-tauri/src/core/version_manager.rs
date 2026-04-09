//! Node.js version management: install, uninstall, switch

use anyhow::{Context, Result};
use std::path::{Path, PathBuf};

use super::downloader;
use super::extractor;
use super::mirror;

/// Determine the platform string for Node.js downloads
fn node_platform() -> &'static str {
    #[cfg(target_os = "windows")]
    { "win" }
    #[cfg(target_os = "macos")]
    { "darwin" }
    #[cfg(target_os = "linux")]
    { "linux" }
}

/// Determine the architecture string for Node.js downloads
fn node_arch() -> &'static str {
    #[cfg(target_arch = "x86_64")]
    { "x64" }
    #[cfg(target_arch = "aarch64")]
    { "arm64" }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    { "x64" }
}

/// Determine the archive extension for current platform
fn archive_extension() -> &'static str {
    #[cfg(target_os = "windows")]
    { "zip" }
    #[cfg(not(target_os = "windows"))]
    { "tar.xz" }
}

/// Install a Node.js version to the specified directory
/// Full flow: download -> verify SHA256 -> extract -> done
pub async fn install_version(
    version: &str,
    install_dir: &Path,
    mirror_url: &str,
) -> Result<()> {
    let platform = node_platform();
    let arch = node_arch();
    let ext = archive_extension();

    let filename = mirror::get_download_filename(version, platform, arch, ext);
    let download_url = mirror::build_download_url(mirror_url, version, &filename);
    let checksum_url = mirror::build_checksum_url(mirror_url, version);

    // Prepare directories
    let cache_dir = PathBuf::from(install_dir).join("cache");
    let versions_dir = PathBuf::from(install_dir).join("versions");
    let version_dir = versions_dir.join(version);

    std::fs::create_dir_all(&cache_dir)?;
    std::fs::create_dir_all(&versions_dir)?;

    let archive_path = cache_dir.join(&filename);

    // Step 1: Download the archive
    downloader::download_file_with_retry(
        &download_url,
        &archive_path,
        |progress| {
            // Progress is reported via Tauri events (handled at command level)
            let _ = progress;
        },
        3,
    )
    .await
    .context("Failed to download Node.js archive")?;

    // Step 2: Verify SHA256 checksum
    match downloader::fetch_checksums(&checksum_url).await {
        Ok(checksums) => {
            if let Some(expected_hash) = checksums.get(&filename) {
                let valid = downloader::verify_checksum(&archive_path, expected_hash)?;
                if !valid {
                    // Clean up the corrupted file
                    let _ = std::fs::remove_file(&archive_path);
                    anyhow::bail!("SHA256 checksum verification failed for {}", filename);
                }
            }
        }
        Err(e) => {
            // Log warning but don't fail - checksum might not be available from all mirrors
            eprintln!("Warning: Could not verify checksum: {}", e);
        }
    }

    // Step 3: Extract archive to version directory
    if version_dir.exists() {
        std::fs::remove_dir_all(&version_dir)?;
    }
    std::fs::create_dir_all(&version_dir)?;

    extractor::extract_archive(&archive_path, &version_dir)
        .context("Failed to extract Node.js archive")?;

    // Verify extraction was successful
    #[cfg(not(target_os = "windows"))]
    let node_binary = version_dir.join("bin").join("node");
    #[cfg(target_os = "windows")]
    let node_binary = version_dir.join("node.exe");

    if !node_binary.exists() {
        anyhow::bail!(
            "Installation verification failed: node binary not found at {:?}",
            node_binary
        );
    }

    Ok(())
}

/// Switch to a different installed version by updating the symlink/junction
pub async fn switch_version(version: &str, install_dir: &Path) -> Result<()> {
    let versions_dir = install_dir.join("versions");
    let version_dir = versions_dir.join(version);
    let current_link = install_dir.join("current");

    if !version_dir.exists() {
        anyhow::bail!("Version {} is not installed at {:?}", version, version_dir);
    }

    // Remove existing link
    if current_link.exists() || current_link.is_symlink() {
        #[cfg(target_os = "windows")]
        {
            // On Windows, remove the junction point
            if current_link.is_dir() {
                std::fs::remove_dir(&current_link)?;
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            std::fs::remove_file(&current_link)
                .or_else(|_| std::fs::remove_dir(&current_link))?;
        }
    }

    // Create new link
    #[cfg(target_os = "windows")]
    {
        // Windows: use junction point
        std::os::windows::fs::symlink_dir(&version_dir, &current_link)?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        // Unix: use symbolic link
        std::os::unix::fs::symlink(&version_dir, &current_link)?;
    }

    Ok(())
}

/// Uninstall a version by removing its directory
pub async fn uninstall_version(version: &str, install_dir: &Path) -> Result<()> {
    let version_dir = install_dir.join("versions").join(version);

    if version_dir.exists() {
        std::fs::remove_dir_all(&version_dir)
            .context(format!("Failed to remove version directory: {:?}", version_dir))?;
    }

    // Also remove cached archive if exists
    let cache_dir = install_dir.join("cache");
    if cache_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&cache_dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    if name.contains(version) {
                        let _ = std::fs::remove_file(entry.path());
                    }
                }
            }
        }
    }

    Ok(())
}

/// List all installed versions by scanning the versions directory
pub fn list_installed(install_dir: &Path) -> Result<Vec<String>> {
    let versions_dir = install_dir.join("versions");
    let mut versions = Vec::new();

    if !versions_dir.exists() {
        return Ok(versions);
    }

    for entry in std::fs::read_dir(&versions_dir)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            if let Some(name) = entry.file_name().to_str() {
                if name.starts_with('v') {
                    versions.push(name.to_string());
                }
            }
        }
    }

    versions.sort_by(|a, b| b.cmp(a)); // Newest first
    Ok(versions)
}
