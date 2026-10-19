import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, GripHorizontal, LockKeyhole, Settings2, X } from 'lucide-react';
import { dateKey, holidays, lunarText, monthGrid, sameDate, shiftMonth, solarText, supported, todayInVietnam, toLunar, weekday, type CivilDate } from './calendar';
import { desktopDefaults, openMain, readDesktop, updateDesktop, watchDesktop } from './desktop';
import { readTheme, watchTheme, type Theme } from './preferences';

export default function Widget() {
  const [today, setToday] = useState(todayInVietnam);
  const [selected, setSelected] = useState<CivilDate>(() => supported(todayInVietnam()) ? todayInVietnam() : { day: 1, month: 1, year: 1900 });
  const [settings, setSettings] = useState(desktopDefaults);
  const [theme, setTheme] = useState<Theme>('system');
  const [error, setError] = useState('');
  const lunar = useMemo(() => supported(today) ? toLunar(today) : null, [today]);
  const cells = useMemo(() => monthGrid(selected.year, selected.month), [selected.year, selected.month]);
  const [followToday, setFollowToday] = useState(true);
  useEffect(() => {
    let alive = true;
    const unsubs: (() => void)[] = [];
    const retain = (unsubscribe: () => void) => { if (alive) unsubs.push(unsubscribe); else unsubscribe(); };
    void readDesktop().then(value => { if (alive) setSettings(value); }).catch(e => { if (alive) setError(String(e)); });
    void watchDesktop(value => { if (alive) setSettings(value); }).then(retain).catch(e => { if (alive) setError(String(e)); });
    void readTheme().then(value => { if (alive) setTheme(value); }).catch(() => {});
    void watchTheme(value => { if (alive) setTheme(value); }).then(retain).catch(() => {});
    return () => { alive = false; unsubs.forEach(unsubscribe => unsubscribe()); };
  }, []);
  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { document.documentElement.dataset.theme = theme === 'system' ? (query.matches ? 'dark' : 'light') : theme; };
    apply(); query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    const refresh = () => {
      const value = todayInVietnam();
      setToday(old => sameDate(old, value) ? old : value);
      if (followToday && supported(value)) setSelected(old => sameDate(old, value) ? old : value);
    };
    const timer = setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [followToday]);
  const perform = (action: Promise<unknown>) => { void action.catch(error => setError(String(error))); };
  const select = (date: CivilDate) => { if (supported(date)) { setSelected(date); setFollowToday(sameDate(date, today)); } };
  const detail = supported(selected) ? toLunar(selected) : null;
  return <main className="desktop-widget" aria-label="Widget Lịch âm" style={{ '--widget-alpha': (100 - settings.transparency) / 100 } as CSSProperties}>
    <div className={`widget-drag ${settings.locked ? 'locked' : ''}`} data-tauri-drag-region={settings.locked ? 'false' : 'deep'} title={settings.locked ? 'Vị trí đã khóa' : 'Kéo để di chuyển widget'}>
      <span className="widget-brand"><CalendarDays size={15} /> Lịch âm</span>
      {settings.locked ? <LockKeyhole size={12} aria-label="Đã khóa vị trí" /> : <GripHorizontal className="widget-grip" size={17} />}
      <div className="widget-controls"><button aria-label="Cài đặt widget" onClick={() => perform(openMain(true))}><Settings2 size={14} /></button><button aria-label="Ẩn widget" onClick={() => perform(updateDesktop({ widgetEnabled: false }))}><X size={14} /></button></div>
    </div>
    <section className="widget-today" aria-label="Hôm nay">
      <div className="widget-lunar-number">{lunar?.day ?? '—'}<span>ÂM LỊCH</span></div>
      <div className="widget-today-info"><strong>{lunar ? `Tháng ${lunar.month}${lunar.leap ? ' nhuận' : ''} · ${lunar.yearName}` : 'Ngoài phạm vi hỗ trợ'}</strong><span>{weekday(today)}, {solarText(today)}</span></div>
    </section>
    <div className="widget-month"><button aria-label="Tháng trước" disabled={!supported(shiftMonth(selected, -1))} onClick={() => select(shiftMonth(selected, -1))}><ChevronLeft size={16} /></button><strong>Tháng {selected.month} <span>/ {selected.year}</span></strong><button aria-label="Tháng sau" disabled={!supported(shiftMonth(selected, 1))} onClick={() => select(shiftMonth(selected, 1))}><ChevronRight size={16} /></button></div>
    <div className="widget-grid" role="grid" aria-label={`Tháng ${selected.month} năm ${selected.year}`}>
      <div className="widget-week" role="row">{['T2','T3','T4','T5','T6','T7','CN'].map(day => <span role="columnheader" key={day}>{day}</span>)}</div>
      {Array.from({ length: 6 }, (_, row) => <div className="widget-days" role="row" key={row}>{cells.slice(row * 7, row * 7 + 7).map(date => {
        const value = toLunar(date); const events = holidays(date, value);
        return <button key={dateKey(date)} role="gridcell" aria-selected={sameDate(date, selected)} aria-current={sameDate(date, today) ? 'date' : undefined} aria-label={`${solarText(date)}, âm lịch ${lunarText(value)}${events.length ? `, ${events.join(', ')}` : ''}`} disabled={!supported(date)} onClick={() => select(date)}
          className={[sameDate(date, today) && 'today', sameDate(date, selected) && 'selected', date.month !== selected.month && 'outside', (value.day === 1 || value.day === 15) && 'lunar-special'].filter(Boolean).join(' ')}>
          <span>{date.day}</span><small>{value.day === 1 ? `${value.day}/${value.month}${value.leap ? 'n' : ''}` : value.day}</small>{events.length > 0 && <i />}
        </button>;
      })}</div>)}
    </div>
    <p className="widget-detail" aria-live="polite">{detail ? `${solarText(selected)} · ${lunarText(detail)} âm lịch` : 'Hỗ trợ ngày dương 1900–2100'}</p>
    <div className="widget-footer"><button onClick={() => select(today)} disabled={!supported(today)}>Về hôm nay</button><button onClick={() => perform(openMain())}>Mở lịch đầy đủ <ArrowUpRight size={13} /></button></div>
    {error && <p className="widget-error" role="alert" onClick={() => perform(openMain(true))}>{error}</p>}
  </main>;
}
