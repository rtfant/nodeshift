//! Archive extraction: tar.xz for Unix, zip for Windows

use anyhow::{Context, Result};
use std::path::Path;

/// Extract an archive to the specified directory
/// Supports .tar.xz (Unix) and .zip (Windows)
pub fn extract_archive(archive_path: &Path, dest_dir: &Path) -> Result<()> {
    std::fs::create_dir_all(dest_dir)?;

    let filename = archive_path
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("");

    if filename.ends_with(".tar.xz") {
        extract_tar_xz(archive_path, dest_dir)
    } else if filename.ends_with(".zip") {
        extract_zip(archive_path, dest_dir)
    } else if filename.ends_with(".tar.gz") {
        extract_tar_gz(archive_path, dest_dir)
    } else {
        anyhow::bail!("Unsupported archive format: {}", filename)
    }
}

/// Extract .tar.xz archive (used on macOS and Linux)
fn extract_tar_xz(archive_path: &Path, dest_dir: &Path) -> Result<()> {
    let file = std::fs::File::open(archive_path)
        .context("Failed to open tar.xz archive")?;

    // Decompress xz
    let decompressor = xz2::read::XzDecoder::new(file);

    // Extract tar
    let mut archive = tar::Archive::new(decompressor);

    // Node.js archives contain a top-level directory like node-v22.15.0-linux-x64/
    // We need to strip this prefix and extract contents directly to dest_dir
    for entry in archive.entries()? {
        let mut entry = entry?;
        let path = entry.path()?;

        // Strip the first component (e.g., node-v22.15.0-linux-x64)
        let relative: std::path::PathBuf = path.components().skip(1).collect();
        if relative.as_os_str().is_empty() {
            continue;
        }

        let target = dest_dir.join(&relative);

        // Create parent directories
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent)?;
        }

        entry.unpack(&target)?;
    }

    Ok(())
}

/// Extract .tar.gz archive (fallback)
fn extract_tar_gz(archive_path: &Path, dest_dir: &Path) -> Result<()> {
    let file = std::fs::File::open(archive_path)
        .context("Failed to open tar.gz archive")?;

    let decompressor = flate2::read::GzDecoder::new(file);
    let mut archive = tar::Archive::new(decompressor);

    for entry in archive.entries()? {
        let mut entry = entry?;
        let path = entry.path()?;
        let relative: std::path::PathBuf = path.components().skip(1).collect();
        if relative.as_os_str().is_empty() {
            continue;
        }
        let target = dest_dir.join(&relative);
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent)?;
        }
        entry.unpack(&target)?;
    }

    Ok(())
}

/// Extract .zip archive (used on Windows)
fn extract_zip(archive_path: &Path, dest_dir: &Path) -> Result<()> {
    let file = std::fs::File::open(archive_path)
        .context("Failed to open zip archive")?;

    let mut archive = zip::ZipArchive::new(file)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let outpath = match file.enclosed_name() {
            Some(path) => {
                // Strip first component just like tar
                let relative: std::path::PathBuf = path.components().skip(1).collect();
                if relative.as_os_str().is_empty() {
                    continue;
                }
                dest_dir.join(relative)
            }
            None => continue,
        };

        if file.name().ends_with('/') {
            std::fs::create_dir_all(&outpath)?;
        } else {
            if let Some(parent) = outpath.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let mut outfile = std::fs::File::create(&outpath)?;
            std::io::copy(&mut file, &mut outfile)?;
        }

        // Set permissions on Unix
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = file.unix_mode() {
                std::fs::set_permissions(&outpath, std::fs::Permissions::from_mode(mode))?;
            }
        }
    }

    Ok(())
}
