//! File downloader with progress reporting, retry, and SHA256 checksum verification

use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use std::path::Path;
use tokio::io::AsyncWriteExt;

/// Download progress callback data
#[allow(dead_code)]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub speed: f64, // bytes per second
}

/// Download a file from URL to the specified path with progress reporting
pub async fn download_file(
    url: &str,
    dest: &Path,
    on_progress: impl Fn(DownloadProgress),
) -> Result<()> {
    // Create parent directory if needed
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()?;

    let response = client
        .get(url)
        .header("User-Agent", "NodeShift/0.1.0")
        .send()
        .await
        .context("Failed to start download")?;

    if !response.status().is_success() {
        anyhow::bail!("HTTP error: {}", response.status());
    }

    let total = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let start_time = std::time::Instant::now();

    let mut file = tokio::fs::File::create(dest).await?;
    let mut stream = response.bytes_stream();

    use futures_util::StreamExt;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.context("Error reading download stream")?;
        file.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;

        let elapsed = start_time.elapsed().as_secs_f64();
        let speed = if elapsed > 0.0 {
            downloaded as f64 / elapsed
        } else {
            0.0
        };

        on_progress(DownloadProgress {
            downloaded,
            total,
            speed,
        });
    }

    file.flush().await?;
    Ok(())
}

/// Download a file with automatic retry (up to 3 attempts)
pub async fn download_file_with_retry(
    url: &str,
    dest: &Path,
    on_progress: impl Fn(DownloadProgress),
    max_retries: u32,
) -> Result<()> {
    let mut last_error = None;

    for attempt in 0..=max_retries {
        if attempt > 0 {
            // Wait before retry with exponential backoff
            tokio::time::sleep(std::time::Duration::from_secs(2u64.pow(attempt))).await;
        }

        match download_file(url, dest, &on_progress).await {
            Ok(()) => return Ok(()),
            Err(e) => {
                last_error = Some(e);
            }
        }
    }

    Err(last_error.unwrap_or_else(|| anyhow::anyhow!("Download failed after retries")))
}

/// Verify SHA256 checksum of a file
pub fn verify_checksum(file_path: &Path, expected_hash: &str) -> Result<bool> {
    let mut file = std::fs::File::open(file_path)?;
    let mut hasher = Sha256::new();
    std::io::copy(&mut file, &mut hasher)?;
    let result = hasher.finalize();
    let actual_hash = format!("{:x}", result);
    Ok(actual_hash == expected_hash.to_lowercase())
}

/// Fetch and parse SHA256 checksums for a specific version
pub async fn fetch_checksums(checksum_url: &str) -> Result<std::collections::HashMap<String, String>> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;

    let response = client
        .get(checksum_url)
        .header("User-Agent", "NodeShift/0.1.0")
        .send()
        .await?;

    let text = response.text().await?;
    let mut checksums = std::collections::HashMap::new();

    for line in text.lines() {
        let parts: Vec<&str> = line.splitn(2, "  ").collect();
        if parts.len() == 2 {
            let hash = parts[0].trim().to_string();
            let filename = parts[1].trim().to_string();
            checksums.insert(filename, hash);
        }
    }

    Ok(checksums)
}
