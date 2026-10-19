use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, Position, WebviewWindow};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_store::StoreExt;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct DesktopSettings {
    pub widget_enabled: bool,
    pub transparency: u8,
    pub locked: bool,
    pub always_on_top: bool,
    pub startup: bool,
}
impl Default for DesktopSettings {
    fn default() -> Self {
        Self { widget_enabled: true, transparency: 60, locked: false, always_on_top: false, startup: false }
    }
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DesktopPatch {
    widget_enabled: Option<bool>,
    transparency: Option<u8>,
    locked: Option<bool>,
    always_on_top: Option<bool>,
    startup: Option<bool>,
}
pub struct SettingsLock(pub Mutex<()>);

fn set_startup(app: &AppHandle, enabled: bool) -> Result<(), String> {
    if enabled {
        app.autolaunch().enable().map_err(|e| e.to_string())?;
        // Quote the executable path: installed paths may contain spaces.
        #[cfg(windows)]
        {
            let path = std::env::current_exe().map_err(|e| e.to_string())?;
            windows_registry::CURRENT_USER.create(r"Software\Microsoft\Windows\CurrentVersion\Run")
                .and_then(|key| key.set_string("Lịch âm", format!("\"{}\" --autostart", path.display())))
                .map_err(|e| e.to_string())?;
        }
    } else { app.autolaunch().disable().map_err(|e| e.to_string())?; }
    Ok(())
}

pub fn read(app: &AppHandle) -> Result<DesktopSettings, String> {
    let store = app.store("preferences.json").map_err(|e| e.to_string())?;
    let mut settings: DesktopSettings = store.get("desktop").and_then(|value| serde_json::from_value(value).ok()).unwrap_or_default();
    settings.transparency = settings.transparency.min(100);
    settings.startup = app.autolaunch().is_enabled().map_err(|e| e.to_string())?;
    Ok(settings)
}

fn apply(app: &AppHandle, settings: &DesktopSettings) -> Result<(), String> {
    let widget = app.get_webview_window("widget").ok_or("Không tìm thấy widget.")?;
    widget.set_always_on_top(settings.always_on_top).map_err(|e| e.to_string())?;
    if settings.widget_enabled {
        keep_on_screen(&widget, false)?;
        widget.show().map_err(|e| e.to_string())?;
    } else {
        widget.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_desktop_settings(app: AppHandle) -> Result<DesktopSettings, String> { read(&app) }

#[tauri::command]
pub fn update_desktop_settings(app: AppHandle, patch: DesktopPatch) -> Result<DesktopSettings, String> {
    let lock = app.state::<SettingsLock>();
    let _guard = lock.0.lock().map_err(|_| "Không thể cập nhật cài đặt.")?;
    let previous = read(&app)?;
    let mut next = previous.clone();
    if let Some(value) = patch.widget_enabled { next.widget_enabled = value; }
    if let Some(value) = patch.transparency {
        if value > 100 { return Err("Độ trong suốt cần nằm trong khoảng 0–100%.".into()); }
        next.transparency = value;
    }
    if let Some(value) = patch.locked { next.locked = value; }
    if let Some(value) = patch.always_on_top { next.always_on_top = value; }
    if let Some(value) = patch.startup {
        next.startup = value;
        if value { next.widget_enabled = true; }
    }
    let store = app.store("preferences.json").map_err(|e| e.to_string())?;
    let change = (|| -> Result<(), String> {
        if next.startup != previous.startup {
            set_startup(&app, next.startup)?;
        }
        apply(&app, &next)?;
        store.set("desktop", serde_json::to_value(&next).map_err(|e| e.to_string())?);
        store.save().map_err(|e| e.to_string())?;
        Ok(())
    })();
    if let Err(error) = change {
        if next.startup != previous.startup {
            let _ = set_startup(&app, previous.startup);
        }
        let _ = apply(&app, &previous);
        store.set("desktop", serde_json::to_value(&previous).unwrap_or_default());
        let _ = store.save();
        return Err(format!("Chưa lưu được cài đặt: {error}"));
    }
    let _ = app.emit("desktop-settings-changed", &next);
    Ok(next)
}

pub fn show_main_window(app: &AppHandle, settings: bool) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("Không tìm thấy cửa sổ lịch.")?;
    keep_on_screen(&window, false)?;
    window.show().map_err(|e| e.to_string())?;
    window.unminimize().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    if settings { let _ = window.emit("open-settings", ()); }
    Ok(())
}
#[tauri::command]
pub fn show_main(app: AppHandle, settings: bool) -> Result<(), String> { show_main_window(&app, settings) }

/// Move an off-screen window to the current monitor's work area. Full bounds
/// (not just the top-left corner) must fit, including negative monitor origins.
pub fn keep_on_screen(window: &WebviewWindow, reset: bool) -> Result<(), String> {
    let position = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let monitors = window.available_monitors().map_err(|e| e.to_string())?;
    let fits = monitors.iter().any(|monitor| {
        let area = monitor.work_area();
        bounds_fit(position.x, position.y, size.width, size.height, area.position.x, area.position.y, area.size.width, area.size.height)
    });
    if reset || !fits {
        if let Some(monitor) = window.current_monitor().map_err(|e| e.to_string())?.or(window.primary_monitor().map_err(|e| e.to_string())?) {
            let area = monitor.work_area();
            let margin = (16.0 * monitor.scale_factor()) as i32;
            let x = (area.position.x + area.size.width as i32 - size.width as i32 - margin).max(area.position.x);
            let y = (area.position.y + margin).min(area.position.y + area.size.height.saturating_sub(size.height) as i32);
            window.set_position(Position::Physical(PhysicalPosition::new(x, y))).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn bounds_fit(x: i32, y: i32, w: u32, h: u32, ax: i32, ay: i32, aw: u32, ah: u32) -> bool {
    i64::from(x) >= i64::from(ax) && i64::from(y) >= i64::from(ay) &&
        i64::from(x) + i64::from(w) <= i64::from(ax) + i64::from(aw) &&
        i64::from(y) + i64::from(h) <= i64::from(ay) + i64::from(ah)
}

#[tauri::command]
pub fn reset_widget_position(app: AppHandle) -> Result<(), String> {
    let widget = app.get_webview_window("widget").ok_or("Không tìm thấy widget.")?;
    keep_on_screen(&widget, true)
}

#[tauri::command]
pub fn quit_app(app: AppHandle) { app.exit(0); }

pub fn set_visible(app: &AppHandle, visible: bool) {
    if let Err(error) = update_desktop_settings(app.clone(), DesktopPatch { widget_enabled: Some(visible), ..Default::default() }) {
        eprintln!("{error}");
        let _ = show_main_window(app, true);
        let _ = app.emit("desktop-error", error);
    }
}

pub fn startup(app: &AppHandle) -> Result<(), String> {
    let mut settings = read(app)?;
    let widget_only = std::env::args().any(|arg| arg == "--autostart" || arg == "--widget");
    if widget_only { settings.widget_enabled = true; }
    // Share the actual launch visibility with both webviews.
    let store = app.store("preferences.json").map_err(|e| e.to_string())?;
    store.set("desktop", serde_json::to_value(&settings).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())?;
    apply(app, &settings)?;
    if !widget_only { show_main_window(app, false)?; }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_window_bounds_with_negative_monitor_origins() {
        assert!(bounds_fit(-1900, 10, 360, 480, -1920, 0, 1920, 1040));
        assert!(!bounds_fit(-200, 10, 360, 480, -1920, 0, 1920, 1040));
        assert!(!bounds_fit(1800, 10, 360, 480, 0, 0, 1920, 1040));
        assert!(!bounds_fit(10, 1000, 360, 480, 0, 0, 1920, 1040));
    }
    #[test]
    fn old_preferences_gain_safe_defaults() {
        let settings: DesktopSettings = serde_json::from_str("{}").unwrap();
        assert_eq!(settings.transparency, 60);
        assert!(!settings.startup);
        assert!(!settings.always_on_top);
        assert!(settings.widget_enabled);
    }
}
