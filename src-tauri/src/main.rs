#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod desktop;
use tauri::{menu::{Menu, MenuItem}, tray::{MouseButton, TrayIconBuilder, TrayIconEvent}, Manager};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if args.iter().any(|arg| arg == "--autostart" || arg == "--widget") {
                desktop::set_visible(app, true);
            } else { let _ = desktop::show_main_window(app, false); }
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::Builder::new().app_name("Lịch âm").arg("--autostart").build())
        .plugin(tauri_plugin_window_state::Builder::default()
            .with_state_flags(tauri_plugin_window_state::StateFlags::POSITION | tauri_plugin_window_state::StateFlags::SIZE).build())
        .manage(desktop::SettingsLock(std::sync::Mutex::new(())))
        .invoke_handler(tauri::generate_handler![desktop::get_desktop_settings, desktop::update_desktop_settings,
            desktop::show_main, desktop::reset_widget_position, desktop::quit_app])
        .setup(|app| {
            let menu = Menu::with_items(app, &[
                &MenuItem::with_id(app, "widget", "Hiện / ẩn widget", true, None::<&str>)?,
                &MenuItem::with_id(app, "main", "Mở lịch đầy đủ", true, None::<&str>)?,
                &MenuItem::with_id(app, "settings", "Cài đặt", true, None::<&str>)?,
                &MenuItem::with_id(app, "reset", "Đặt lại vị trí widget", true, None::<&str>)?,
                &MenuItem::with_id(app, "quit", "Thoát Lịch âm", true, None::<&str>)?,
            ])?;
            TrayIconBuilder::with_id("lich-am-tray").icon(app.default_window_icon().unwrap().clone())
                .tooltip("Lịch âm").menu(&menu).show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "widget" => { let visible = desktop::read(app).map(|s| !s.widget_enabled).unwrap_or(true); desktop::set_visible(app, visible); }
                    "main" => { let _ = desktop::show_main_window(app, false); }
                    "settings" => { let _ = desktop::show_main_window(app, true); }
                    "reset" => { let _ = desktop::reset_widget_position(app.clone()); desktop::set_visible(app, true); }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::DoubleClick { button: MouseButton::Left, .. } = event {
                        let _ = desktop::show_main_window(tray.app_handle(), false);
                    }
                }).build(app)?;
            desktop::startup(app.handle()).map_err(std::io::Error::other)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if window.label() == "widget" { desktop::set_visible(window.app_handle(), false); }
                else { let _ = window.hide(); }
            }
        })
        .run(tauri::generate_context!())
        .expect("Không thể khởi động Lịch âm");
}
