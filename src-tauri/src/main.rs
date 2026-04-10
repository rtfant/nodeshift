// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let result = std::panic::catch_unwind(|| {
        nodeshift_lib::run()
    });
    if let Err(e) = result {
        eprintln!("PANIC: {:?}", e);
        println!("Press Enter to exit...");
        let mut buf = String::new();
        let _ = std::io::stdin().read_line(&mut buf);
    }
}