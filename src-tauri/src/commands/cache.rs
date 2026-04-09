use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CacheInfo {
    pub cache_dir: String,
    pub total_size: u64,
    pub file_count: u64,
}

fn get_cache_dir() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".nodeshift").join("cache")
}

fn calculate_dir_size(path: &PathBuf) -> (u64, u64) {
    let mut total_size: u64 = 0;
    let mut file_count: u64 = 0;

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = fs::metadata(&path) {
                    total_size += metadata.len();
                    file_count += 1;
                }
            } else if path.is_dir() {
                let (size, count) = calculate_dir_size(&path);
                total_size += size;
                file_count += count;
            }
        }
    }

    (total_size, file_count)
}

#[tauri::command]
pub fn get_cache_info() -> CacheInfo {
    let cache_dir = get_cache_dir();
    let cache_dir_str = cache_dir.to_string_lossy().to_string();

    if !cache_dir.exists() {
        return CacheInfo {
            cache_dir: cache_dir_str,
            total_size: 0,
            file_count: 0,
        };
    }

    let (total_size, file_count) = calculate_dir_size(&cache_dir);

    CacheInfo {
        cache_dir: cache_dir_str,
        total_size,
        file_count,
    }
}

#[tauri::command]
pub fn clear_cache() -> CacheInfo {
    let cache_dir = get_cache_dir();
    let cache_dir_str = cache_dir.to_string_lossy().to_string();

    if cache_dir.exists() {
        let _ = fs::remove_dir_all(&cache_dir);
        let _ = fs::create_dir_all(&cache_dir);
    }

    CacheInfo {
        cache_dir: cache_dir_str,
        total_size: 0,
        file_count: 0,
    }
}
