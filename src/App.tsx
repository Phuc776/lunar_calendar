import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowDownUp, ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Moon, Search, Settings2, Sun, Sunrise, X } from 'lucide-react';
import { addDays, dateKey, holidays, lunarMonths, lunarText, MAX_YEAR, MIN_YEAR, monthGrid, sameDate, shiftMonth, solarText, stamp, supported, todayInVietnam, toLunar, toSolar, upcomingHolidays, validSolar, weekday, type CivilDate } from './calendar';
import { readTheme, writeTheme, watchTheme, type Theme } from './preferences';
import DesktopSettings from './DesktopSettings';
import { onOpenSettings } from './desktop';

type DialogName = 'lookup' | 'settings' | 'month' | null;

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="dialog-title" onCancel={onClose} onClick={e => {
    if (e.target === e.currentTarget) {
      const bounds = e.currentTarget.getBoundingClientRect();
      if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) onClose();
    }
  }}>
    <div className="modal-heading"><div><h2 id="dialog-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={19} /></button></div>
    {children}
  </dialog>;
}

function Lookup({ initial, onNavigate }: { initial: CivilDate; onNavigate: (date: CivilDate) => void }) {
  const [mode, setMode] = useState<'solar' | 'lunar'>('solar');
  const [day, setDay] = useState(String(initial.day));
  const [month, setMonth] = useState(`${initial.month}-0`);
  const [year, setYear] = useState(String(initial.year));
  const [error, setError] = useState('');
  const [result, setResult] = useState<CivilDate | null>(null);
  const lunarOptions = useMemo(() => lunarMonths(Number(year)), [year]);
  const clear = () => { setError(''); setResult(null); };
  function changeMode(next: 'solar' | 'lunar') {
    const value = next === 'solar' ? { ...initial, leap: false } : toLunar(initial);
    setMode(next); setDay(String(value.day)); setMonth(`${value.month}-${value.leap ? 1 : 0}`); setYear(String(value.year)); clear();
  }
  function submit(e: React.FormEvent) {
    e.preventDefault(); clear();
    const [m, leap] = month.split('-').map(Number);
    const date = { day: Number(day), month: m, year: Number(year) };
    try {
      if (!day.trim() || !year.trim()) throw new Error('Vui lòng nhập đầy đủ ngày và năm.');
      if (mode === 'solar') {
        if (!validSolar(date)) throw new Error('Ngày dương lịch không tồn tại. Vui lòng kiểm tra lại.');
        if (!supported(date)) throw new Error('Vui lòng chọn ngày dương lịch từ năm 1900 đến 2100.');
        setResult(date);
      } else setResult(toSolar({ ...date, leap: !!leap }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể chuyển đổi ngày.'); }
  }
  const lunar = result && toLunar(result);
  return <>
    <div className="segmented" aria-label="Chiều chuyển đổi">
      <button aria-pressed={mode === 'solar'} className={mode === 'solar' ? 'active' : ''} onClick={() => changeMode('solar')}>Dương → Âm</button>
      <button aria-pressed={mode === 'lunar'} className={mode === 'lunar' ? 'active' : ''} onClick={() => changeMode('lunar')}>Âm → Dương</button>
    </div>
    <form onSubmit={submit} noValidate>
      <p className="field-caption">Nhập ngày {mode === 'solar' ? 'dương' : 'âm'} lịch</p>
      <div className="date-inputs">
        <label>Ngày<input aria-describedby={error ? 'lookup-error' : undefined} type="number" inputMode="numeric" min="1" max={mode === 'solar' ? 31 : 30} value={day} onChange={e => { setDay(e.target.value); clear(); }} /></label>
        <label className="month-input">Tháng<select aria-label="Tháng" value={month} onChange={e => { setMonth(e.target.value); clear(); }}>
          {mode === 'solar' ? Array.from({ length: 12 }, (_, i) => <option key={i} value={`${i + 1}-0`}>Tháng {i + 1}</option>) : lunarOptions.map(m => <option key={`${m.month}-${+m.leap}`} value={`${m.month}-${+m.leap}`}>Tháng {m.month}{m.leap ? ' nhuận' : ''}</option>)}
        </select></label>
        <label>Năm<input type="number" inputMode="numeric" min={mode === 'solar' ? MIN_YEAR : 1899} max={MAX_YEAR} value={year} onChange={e => {
          const value = e.target.value;
          setYear(value);
          if (mode === 'lunar' && !lunarMonths(Number(value)).some(m => `${m.month}-${+m.leap}` === month)) setMonth(`${month.split('-')[0]}-0`);
          clear();
        }} /></label>
      </div>
      {mode === 'lunar' && <p className="input-hint">Tháng nhuận sẽ xuất hiện trong danh sách nếu năm đó có.</p>}
      {error && <p className="error-message" id="lookup-error" role="alert">{error}</p>}
      <button className="button primary full-width" type="submit"><ArrowDownUp size={16} />Chuyển đổi</button>
    </form>
    {result && lunar && <div className="lookup-result" role="status">
      <span className="eyebrow">KẾT QUẢ TRA CỨU</span>
      <p className="result-date">{mode === 'solar' ? lunarText(lunar) : solarText(result)}</p>
      <p>{mode === 'solar' ? `Âm lịch · Năm ${lunar.yearName}` : `${weekday(result)} · Dương lịch`}</p>
      <button className="text-button" onClick={() => onNavigate(result)}>Xem trên lịch <ArrowRight size={15} /></button>
    </div>}
    <p className="modal-footnote"><CircleHelp size={14} /> Phạm vi ngày dương: 01/01/1900 – 31/12/2100.</p>
  </>;
}

function MonthPicker({ initial, onNavigate }: { initial: CivilDate; onNavigate: (date: CivilDate) => void }) {
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(String(initial.year));
  const [error, setError] = useState('');
  return <form onSubmit={e => {
    e.preventDefault();
    const value = Number(year);
    if (!Number.isInteger(value) || value < MIN_YEAR || value > MAX_YEAR) { setError('Năm cần nằm trong khoảng 1900–2100.'); return; }
    onNavigate({ day: 1, month, year: value });
  }} noValidate>
    <label className="year-input">Năm<input type="number" inputMode="numeric" value={year} min={MIN_YEAR} max={MAX_YEAR} onChange={e => { setYear(e.target.value); setError(''); }} /></label>
    <div className="month-options">{Array.from({ length: 12 }, (_, i) => <button type="button" key={i} aria-pressed={month === i + 1} className={month === i + 1 ? 'active' : ''} onClick={() => setMonth(i + 1)}>Tháng {i + 1}</button>)}</div>
    {error && <p className="error-message" role="alert">{error}</p>}
    <button className="button primary full-width" type="submit">Xem tháng này <ArrowRight size={16} /></button>
  </form>;
}

export default function App() {
  const [today, setToday] = useState(todayInVietnam);
  const [selected, setSelected] = useState<CivilDate>(() => supported(todayInVietnam()) ? todayInVietnam() : { day: 1, month: 1, year: MIN_YEAR });
  const [view, setView] = useState(() => ({ year: selected.year, month: selected.month }));
  const [dialog, setDialog] = useState<DialogName>(() => new URLSearchParams(location.search).get('settings') === '1' ? 'settings' : null);
  const [theme, setTheme] = useState<Theme>('system');
  const [preferenceError, setPreferenceError] = useState('');
  const [ready, setReady] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const focusCalendar = useRef(false);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const selectedLunar = useMemo(() => toLunar(selected), [selected]);
  const todayLunar = useMemo(() => supported(today) ? toLunar(today) : null, [today]);
  const cells = useMemo(() => monthGrid(view.year, view.month).map(date => ({ date, lunar: toLunar(date), events: holidays(date) })), [view]);
  const events = holidays(selected, selectedLunar);
  const upcoming = useMemo(() => supported(today) ? upcomingHolidays(today) : [], [today]);

  useEffect(() => {
    let alive = true; const subscriptions: (() => void)[] = [];
    const retain = (unsubscribe: () => void) => { if (alive) subscriptions.push(unsubscribe); else unsubscribe(); };
    void onOpenSettings(() => setDialog('settings')).then(retain).catch(() => {});
    void watchTheme(value => { if (alive) setTheme(value); }).then(retain).catch(() => {});
    return () => { alive = false; subscriptions.forEach(unsubscribe => unsubscribe()); };
  }, []);

  useEffect(() => {
    let active = true;
    readTheme().then(value => { if (active) setTheme(value); }).catch(() => { if (active) setPreferenceError('Không đọc được tùy chọn đã lưu.'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { document.documentElement.dataset.theme = theme === 'system' ? (query.matches ? 'dark' : 'light') : theme; };
    apply(); query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    const refresh = () => setToday(previous => {
      const next = todayInVietnam();
      return sameDate(previous, next) ? previous : next;
    });
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(interval); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  useEffect(() => {
    if (focusCalendar.current) {
      dayRefs.current.get(dateKey(selected))?.focus();
      focusCalendar.current = false;
    }
  }, [selected, view]);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !dialog) { e.preventDefault(); setDialog('lookup'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  function navigate(date: CivilDate) {
    if (!supported(date)) return;
    setSelected(date); setView({ month: date.month, year: date.year });
  }
  function moveMonth(amount: number) { navigate(shiftMonth({ ...view, day: selected.day }, amount)); }
  function onCalendarKey(e: KeyboardEvent<HTMLButtonElement>, date: CivilDate) {
    let next: CivilDate | null = null;
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in offsets) next = addDays(date, offsets[e.key]);
    if (e.key === 'PageUp') next = shiftMonth(date, e.shiftKey ? -12 : -1);
    if (e.key === 'PageDown') next = shiftMonth(date, e.shiftKey ? 12 : 1);
    const offset = (new Date(stamp(date)).getUTCDay() + 6) % 7;
    if (e.key === 'Home') next = addDays(date, -offset);
    if (e.key === 'End') next = addDays(date, 6 - offset);
    if (next) { e.preventDefault(); if (supported(next)) { focusCalendar.current = true; navigate(next); } }
  }
  function chooseTheme(value: Theme) {
    setTheme(value); setPreferenceError('');
    saveQueue.current = saveQueue.current.then(() => writeTheme(value)).catch(() => setPreferenceError('Chưa lưu được giao diện. Bạn có thể chọn lại để thử.'));
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><CalendarDays size={20} strokeWidth={1.7} /></span><h1>Lịch âm</h1></div>
      <div className="topbar-right"><span className="timezone">UTC+7</span><button className="icon-button" title="Cài đặt" aria-label="Cài đặt" onClick={() => setDialog('settings')}><Settings2 size={19} /></button></div>
    </header>

    <main>
      <section className="today-hero" aria-label="Ngày hôm nay">
        <div className="hero-heading"><span className="eyebrow"><span className="live-dot" /> HÔM NAY</span><span className="solar-today">{weekday(today)}, {solarText(today)}</span></div>
        {todayLunar ? <>
          <div className="hero-center"><div className="moon-orbit" aria-hidden="true"><Moon size={80} strokeWidth={0.65} /><span className="orbit-dot" /></div><span className="lunar-number">{String(todayLunar.day).padStart(2, '0')}</span><span className="lunar-unit">ÂM LỊCH</span></div>
          <p className="lunar-month">Tháng {todayLunar.month}{todayLunar.leap ? ' nhuận' : ''} <span>·</span> Năm {todayLunar.yearName}</p>
        </> : <p className="outside-range">Ngày trên máy nằm ngoài phạm vi 1900–2100. Bạn vẫn có thể tra cứu các ngày trong phạm vi này.</p>}
      </section>

      <section className="calendar-section" aria-label="Lịch tháng">
        <div className="month-toolbar">
          <button className="icon-button month-arrow" title="Tháng trước" aria-label="Tháng trước" disabled={view.year === MIN_YEAR && view.month === 1} onClick={() => moveMonth(-1)}><ChevronLeft size={19} /></button>
          <button className="month-title" aria-label={`Chọn tháng và năm, hiện tại tháng ${view.month} năm ${view.year}`} onClick={() => setDialog('month')}>Tháng {view.month} <span>/</span> {view.year}<ChevronDown size={14} /></button>
          <button className="icon-button month-arrow" title="Tháng sau" aria-label="Tháng sau" disabled={view.year === MAX_YEAR && view.month === 12} onClick={() => moveMonth(1)}><ChevronRight size={19} /></button>
        </div>
        <div role="grid" aria-label={`Tháng ${view.month} năm ${view.year}`} className="calendar-grid">
          <div className="week-row" role="row">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => <span role="columnheader" className={i === 6 ? 'sunday-label' : ''} key={d}>{d}</span>)}</div>
          {Array.from({ length: 6 }, (_, row) => <div className="day-row" role="row" key={row}>{cells.slice(row * 7, row * 7 + 7).map(({ date, lunar, events }, col) => {
            const isToday = sameDate(date, today); const isSelected = sameDate(date, selected); const outside = date.month !== view.month;
            const special = lunar.day === 1 || lunar.day === 15;
            const description = `${weekday(date)}, ${solarText(date)}, âm lịch ${lunarText(lunar)}${isToday ? ', hôm nay' : ''}${events.length ? `, ${events.join(', ')}` : ''}`;
            return <button role="gridcell" key={dateKey(date)} ref={el => { if (el) dayRefs.current.set(dateKey(date), el); else dayRefs.current.delete(dateKey(date)); }}
              aria-label={description} aria-selected={isSelected} aria-current={isToday ? 'date' : undefined} title={description} tabIndex={isSelected ? 0 : -1} disabled={!supported(date)}
              className={['day-cell', outside && 'outside', col === 6 && 'sunday', isToday && 'is-today', isSelected && 'is-selected', special && 'special-day'].filter(Boolean).join(' ')}
              onClick={() => navigate(date)} onKeyDown={e => onCalendarKey(e, date)}>
              <span className="solar-day">{date.day}</span><span className="lunar-day">{lunar.day === 1 || date.day === 1 ? `${lunar.day}/${lunar.month}${lunar.leap ? 'n' : ''}` : lunar.day}</span>
              {events.length > 0 && <span className="holiday-dot" aria-hidden="true" />}
            </button>;
          })}</div>)}
        </div>
        <div className="legend"><span><i className="legend-today" />Hôm nay</span><span><i className="legend-lunar" />Mùng 1, rằm</span><span><i className="legend-holiday" />Ngày lễ</span></div>
      </section>

      <section className="selected-card" aria-label="Chi tiết ngày đang chọn" aria-live="polite" aria-atomic="true">
        <div className="selected-icon"><Sunrise size={23} strokeWidth={1.4} /></div>
        <div className="selected-content"><div className="selected-title">{sameDate(selected, today) ? 'Hôm nay' : weekday(selected)} <span>· {solarText(selected)}</span></div><p>{selectedLunar.day === 1 ? 'Mùng 1' : `Ngày ${selectedLunar.day}`} tháng {selectedLunar.month}{selectedLunar.leap ? ' nhuận' : ''}, năm {selectedLunar.yearName}</p>
        {(events.length > 0 || selectedLunar.day === 1 || selectedLunar.day === 15) && <div className="event-tags">{events.length ? events.map(event => <span key={event}>{event}</span>) : <span>{selectedLunar.day === 1 ? 'Ngày đầu tháng âm lịch' : 'Ngày rằm'}</span>}</div>}</div>
      </section>

      <div className="main-actions"><button className="button secondary" disabled={!supported(today)} onClick={() => navigate(today)}><CalendarDays size={16} />Về hôm nay</button><button className="button primary" onClick={() => setDialog('lookup')} title="Tra cứu ngày (Ctrl+K)"><Search size={16} />Tra cứu ngày</button></div>

      {upcoming.length > 0 && <section className="upcoming-section" aria-label="Ngày lễ sắp tới"><div className="section-caption">SẮP TỚI <span>Ngày lễ & dịp đặc biệt</span></div><div className="upcoming-list">{upcoming.map(event => <button key={`${dateKey(event.date)}-${event.name}`} onClick={() => navigate(event.date)}><span className="upcoming-date">{String(event.date.day).padStart(2, '0')}<small>TH {event.date.month}</small></span><span className="upcoming-name">{event.name}<small>{lunarText(toLunar(event.date))} âm lịch</small></span><ChevronRight size={15} /></button>)}</div></section>}
    </main>
    <footer className="app-footer"><Moon size={11} /> Lịch Việt Nam <span>·</span> UTC+7 <span>·</span> 1900–2100</footer>

    {dialog === 'lookup' && <Modal title="Tra cứu ngày" subtitle="Chuyển đổi giữa dương lịch và âm lịch." onClose={() => setDialog(null)}><Lookup initial={selected} onNavigate={date => { navigate(date); setDialog(null); }} /></Modal>}
    {dialog === 'month' && <Modal title="Chọn tháng & năm" subtitle="Đi đến một tháng bất kỳ trong lịch." onClose={() => setDialog(null)}><MonthPicker initial={view.month === selected.month && view.year === selected.year ? selected : { ...view, day: 1 }} onNavigate={date => { navigate(date); setDialog(null); }} /></Modal>}
    {dialog === 'settings' && <Modal title="Cài đặt" subtitle="Một chút tùy chỉnh cho lịch của bạn." onClose={() => setDialog(null)}>
      <p className="field-caption">Giao diện</p><div className="theme-options">{([{ value: 'light', name: 'Sáng', icon: Sun }, { value: 'dark', name: 'Tối', icon: Moon }, { value: 'system', name: 'Hệ thống', icon: Settings2 }] as const).map(item => <button key={item.value} disabled={!ready} aria-pressed={theme === item.value} className={theme === item.value ? 'active' : ''} onClick={() => chooseTheme(item.value)}><item.icon size={23} strokeWidth={1.5} /><span>{item.name}</span>{theme === item.value && <Check className="theme-check" size={13} />}</button>)}</div>
      {preferenceError && <p className="error-message" role="alert">{preferenceError}</p>}
      <DesktopSettings />
      <div className="settings-info"><div><span>Lịch sử dụng</span><strong>Âm lịch Việt Nam</strong></div><div><span>Múi giờ</span><strong>UTC+7 · Việt Nam</strong></div><div><span>Ngày dương hỗ trợ</span><strong>1900–2100</strong></div><div><span>Phiên bản</span><strong>1.1.0</strong></div></div>
      <p className="settings-note">Lịch được tính trên máy và dùng được khi ngoại tuyến. Tùy chọn giao diện được lưu trên thiết bị này.</p>
      <p className="modal-footnote">Mẹo: Ctrl+K để tra cứu. Dùng phím mũi tên để di chuyển trong lịch.</p>
    </Modal>}
  </div>;
}
