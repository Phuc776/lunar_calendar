import { useEffect, useRef, useState } from 'react';
import { Monitor, RotateCcw } from 'lucide-react';
import { desktopDefaults, native, quitApp, readDesktop, resetPosition, updateDesktop, watchDesktop, type DesktopSettings as Settings } from './desktop';

export default function DesktopSettings() {
  const [settings, setSettings] = useState<Settings>(desktopDefaults);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let alive = true; let unsubscribe: (() => void) | undefined;
    void (async () => {
      try {
        unsubscribe = await watchDesktop(value => { if (alive) setSettings(value); });
        if (!alive) { unsubscribe(); return; }
        const value = await readDesktop();
        if (alive) { setSettings(value); setReady(true); }
      } catch { if (alive) setError('Không đọc được cài đặt desktop. Hãy đóng rồi mở lại cửa sổ cài đặt.'); }
    })();
    return () => { alive = false; unsubscribe?.(); };
  }, []);
  function change(patch: Partial<Settings>) {
    setSettings(value => ({ ...value, ...patch })); setError('');
    queue.current = queue.current.then(async () => { await updateDesktop(patch); }).catch(async error => {
      setError(String(error));
      try { setSettings(await readDesktop()); } catch { /* Keep the previous visible state and show the error. */ }
    });
  }
  return <section className="desktop-settings" aria-label="Widget và khởi động">
    <p className="field-caption"><Monitor size={15} /> Widget desktop</p>
    <label className="switch-row"><span><strong>Hiển thị widget</strong><small>Lịch nhỏ, không viền trên desktop.</small></span><input type="checkbox" checked={settings.widgetEnabled} disabled={!ready} onChange={e => change({ widgetEnabled: e.target.checked })} /></label>
    <label className="transparency-control"><span>Độ trong suốt của nền <output>{settings.transparency}%</output></span><input aria-label="Độ trong suốt của nền" type="range" min="0" max="100" step="1" value={settings.transparency} disabled={!ready} onChange={e => change({ transparency: Number(e.target.value) })} /><span className="range-ends"><small>Nền đặc</small><small>Trong suốt</small></span></label>
    <p className="input-hint">Chỉ nền thay đổi, chữ và số ngày vẫn rõ.</p>
    <label className="switch-row"><span>Khóa vị trí widget</span><input type="checkbox" checked={settings.locked} disabled={!ready} onChange={e => change({ locked: e.target.checked })} /></label>
    <label className="switch-row"><span>Luôn hiện trên cùng</span><input type="checkbox" checked={settings.alwaysOnTop} disabled={!ready} onChange={e => change({ alwaysOnTop: e.target.checked })} /></label>
    <button className="text-button reset-widget" disabled={!ready} onClick={() => { void resetPosition().catch(error => setError(String(error))); }}><RotateCcw size={14} /> Đặt lại vị trí widget</button>
    <label className="switch-row startup-row"><span><strong>Khởi động cùng Windows</strong><small>Mở widget sau khi đăng nhập, giữ cửa sổ lớn ẩn.</small></span><input type="checkbox" aria-label="Khởi động cùng Windows" checked={settings.startup} disabled={!ready || !native} onChange={e => change({ startup: e.target.checked })} /></label>
    {!native && <p className="input-hint">Tự khởi động Windows khả dụng trong bản desktop.</p>}
    <p className="desktop-note">Widget là cửa sổ không viền. Win+D có thể ẩn widget cùng các cửa sổ khác. Mở lại từ biểu tượng Lịch âm cạnh đồng hồ Windows.</p>
    {error && <p className="error-message" role="alert">{error}</p>}
    <button className="text-button" disabled={!native} onClick={() => { void quitApp().catch(error => setError(String(error))); }}>Thoát Lịch âm</button>
  </section>;
}
