import { isTauri } from '@tauri-apps/api/core';
import { load } from '@tauri-apps/plugin-store';

export type Theme = 'light' | 'dark' | 'system';
const KEY = 'lich-am-theme';
const valid = (value: unknown): value is Theme => ['light', 'dark', 'system'].includes(String(value));
const store = isTauri() ? load('preferences.json', { autoSave: false, defaults: { theme: 'system' } }) : null;

export async function readTheme(): Promise<Theme> {
  const value: unknown = store ? await (await store).get('theme') : localStorage.getItem(KEY);
  return valid(value) ? value : 'system';
}
export async function writeTheme(theme: Theme): Promise<void> {
  if (store) {
    const data = await store;
    await data.set('theme', theme);
    await data.save();
  } else localStorage.setItem(KEY, theme);
}

export async function watchTheme(callback: (theme: Theme) => void): Promise<() => void> {
  if (store) return (await store).onKeyChange<Theme>('theme', value => callback(valid(value) ? value : 'system'));
  const changed = () => { void readTheme().then(callback); };
  window.addEventListener('storage', changed);
  return () => window.removeEventListener('storage', changed);
}
