//! Mirror source management for Node.js downloads

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct MirrorSource {
    pub name: String,
    pub url: String,
    pub region: String,
}

/// Built-in mirror sources
#[allow(dead_code)]
pub fn builtin_mirrors() -> Vec<MirrorSource> {
    vec![
        MirrorSource {
            name: "官方源".to_string(),
            url: "https://nodejs.org/dist/".to_string(),
            region: "Global".to_string(),
        },
        MirrorSource {
            name: "淘宝源 (npmmirror)".to_string(),
            url: "https://npmmirror.com/mirrors/node/".to_string(),
            region: "China".to_string(),
        },
        MirrorSource {
            name: "华为源".to_string(),
            url: "https://repo.huaweicloud.com/nodejs/".to_string(),
            region: "China".to_string(),
        },
        MirrorSource {
            name: "腾讯源".to_string(),
            url: "https://mirrors.cloud.tencent.com/nodejs-release/".to_string(),
            region: "China".to_string(),
        },
    ]
}

/// Build download URL for a specific version
/// e.g. https://npmmirror.com/mirrors/node/v22.15.0/node-v22.15.0-linux-x64.tar.xz
pub fn build_download_url(mirror: &str, version: &str, filename: &str) -> String {
    format!("{}{}/{}", mirror.trim_end_matches('/'), version, filename)
}

/// Build SHA256 checksum URL for a specific version
pub fn build_checksum_url(mirror: &str, version: &str) -> String {
    format!("{}{}/SHASUMS256.txt", mirror.trim_end_matches('/'), version)
}

/// Build version list URL for the mirror
#[allow(dead_code)]
pub fn build_version_list_url(mirror: &str) -> String {
    format!("{}index.json", mirror.trim_end_matches('/').trim_end_matches("dist").trim_end_matches('/'))
}

/// Get the filename for a Node.js binary download
/// e.g. node-v22.15.0-linux-x64.tar.xz
pub fn get_download_filename(version: &str, platform: &str, arch: &str, extension: &str) -> String {
    format!("node-{}-{}-{}.{}", version, platform, arch, extension)
}
