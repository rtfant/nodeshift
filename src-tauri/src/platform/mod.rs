#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;

use anyhow::Result;
use std::path::PathBuf;

/// Platform-agnostic interface for OS-specific operations
pub trait PlatformOps {
    /// Add NodeShift to system PATH
    fn add_to_path(nodeshift_dir: &PathBuf) -> Result<()>;

    /// Remove NodeShift from system PATH
    fn remove_from_path(nodeshift_dir: &PathBuf) -> Result<()>;

    /// Create a symlink/junction pointing current -> target version
    fn create_version_link(current_dir: &PathBuf, target_dir: &PathBuf) -> Result<()>;

    /// Remove the version symlink/junction
    fn remove_version_link(current_dir: &PathBuf) -> Result<()>;

    /// Get the expected download file extension
    fn archive_extension() -> &'static str;

    /// Get the platform identifier for Node.js download filenames
    fn node_platform() -> &'static str;

    /// Get the architecture identifier for Node.js download filenames
    fn node_arch() -> &'static str;
}
