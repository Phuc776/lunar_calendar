import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface DesktopSettings {
  widgetEnabled: boolean;
  transparency: number;
  locked: boolean;
  alwaysOnTop: boolean;
  startup: boolean;
}
export const desktopDefaults: DesktopSettings = { widgetEnabled: true, transparency: 60, locked: false, alwaysOnTop: false, startup: false };
const KEY = 'lich-am-desktop';
export const native = isTauri();

export async function readDesktop(): Promise<DesktopSettings> {
  if (native) return invoke('get_desktop_settings');
  try { return { ...desktopDefaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...desktopDefaults }; }
}
export async function updateDesktop(patch: Partial<DesktopSettings>): Promise<DesktopSettings> {
  if (native) return invoke('update_desktop_settings', { patch });
  const value = { ...await readDesktop(), ...patch };
  if (patch.startup) value.widgetEnabled = true;
  value.transparency = Math.min(100, Math.max(0, value.transparency));
  localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('desktop-settings-changed', { detail: value }));
  return value;
}
export async function watchDesktop(callback: (settings: DesktopSettings) => void): Promise<() => void> {
  if (native) return listen<DesktopSettings>('desktop-settings-changed', event => callback(event.payload));
  const changed = () => { void readDesktop().then(callback); };
  window.addEventListener('desktop-settings-changed', changed); window.addEventListener('storage', changed);
  return () => { window.removeEventListener('desktop-settings-changed', changed); window.removeEventListener('storage', changed); };
}
export async function openMain(settings = false): Promise<void> {
  if (native) return invoke('show_main', { settings });
  window.open(`/${settings ? '?settings=1' : ''}`, 'lich-am-main');
}
export async function resetPosition(): Promise<void> {
  if (native) return invoke('reset_widget_position');
}
export async function quitApp(): Promise<void> {
  if (native) return invoke('quit_app');
}
export async function onOpenSettings(callback: () => void): Promise<() => void> {
  if (native) return listen('open-settings', callback);
  return () => {};
}
