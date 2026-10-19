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
