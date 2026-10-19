import { SolarDate, LunarDate } from '@nghiavuive/lunar_date_vi';

export type CivilDate = { day: number; month: number; year: number };
export type Lunar = CivilDate & { leap: boolean; yearName: string };
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;
export const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const DAY_MS = 86_400_000;

export function stamp(date: CivilDate): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}
export function fromStamp(value: number): CivilDate {
  const date = new Date(value);
  return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}
export function dateKey(date: CivilDate): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}
export function sameDate(a: CivilDate, b: CivilDate): boolean {
  return a.day === b.day && a.month === b.month && a.year === b.year;
}
export function supported(date: CivilDate): boolean {
  return date.year >= MIN_YEAR && date.year <= MAX_YEAR && validSolar(date);
}
export function validSolar(date: CivilDate): boolean {
  return Object.values(date).every(Number.isInteger) && sameDate(fromStamp(stamp(date)), date);
}
export function todayInVietnam(now = new Date()): CivilDate {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'numeric', year: 'numeric',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(p => p.type === type)?.value);
  return { day: get('day'), month: get('month'), year: get('year') };
}
export function addDays(date: CivilDate, amount: number): CivilDate {
  return fromStamp(stamp(date) + amount * DAY_MS);
}
export function shiftMonth(date: CivilDate, amount: number): CivilDate {
  const start = fromStamp(Date.UTC(date.year, date.month - 1 + amount, 1));
  const last = new Date(Date.UTC(start.year, start.month, 0)).getUTCDate();
  return { ...start, day: Math.min(date.day, last) };
}
export function weekday(date: CivilDate): string {
  return WEEKDAYS[new Date(stamp(date)).getUTCDay()];
}
export function solarText(date: CivilDate): string {
  return `${String(date.day).padStart(2, '0')}/${String(date.month).padStart(2, '0')}/${date.year}`;
}
export function lunarText(date: Lunar): string {
  return `${date.day}/${date.month}${date.leap ? ' nhuận' : ''}/${date.year}`;
}
export function toLunar(date: CivilDate): Lunar {
  if (!validSolar(date)) throw new Error('Ngày dương lịch không tồn tại.');
  const lunar = new SolarDate(date).toLunarDate().get();
  return { day: lunar.day, month: lunar.month, year: lunar.year, leap: lunar.leap_month, yearName: lunar.year_name };
}
export function toSolar(date: CivilDate & { leap: boolean }): CivilDate {
  if (!Object.values({ day: date.day, month: date.month, year: date.year }).every(Number.isInteger) ||
    date.day < 1 || date.day > 30 || date.month < 1 || date.month > 12 || date.year < 1899 || date.year > MAX_YEAR) {
    throw new Error('Ngày âm lịch không hợp lệ.');
  }
  try {
    const lunar = new LunarDate({ day: date.day, month: date.month, year: date.year, leap_month: date.leap });
    lunar.init();
    const solar = lunar.toSolarDate().get();
    const result = { day: solar.day, month: solar.month, year: solar.year };
    const check = toLunar(result);
    if (!sameDate(check, date) || check.leap !== date.leap) throw new Error('Invalid');
    if (!supported(result)) throw new RangeError('outside');
    return result;
  } catch (error) {
    if (error instanceof RangeError) throw new Error('Ngày kết quả nằm ngoài phạm vi dương lịch 1900–2100.');
    throw new Error('Ngày hoặc tháng nhuận này không tồn tại. Vui lòng kiểm tra lại.');
  }
}

export type LunarMonth = { month: number; leap: boolean };
const monthCache = new Map<number, LunarMonth[]>();
export function lunarMonths(year: number): LunarMonth[] {
  if (!Number.isInteger(year) || year < 1899 || year > MAX_YEAR) return [];
  const cached = monthCache.get(year);
  if (cached) return cached;
  const months: LunarMonth[] = [];
  for (let month = 1; month <= 12; month++) {
    months.push({ month, leap: false });
    try {
      const candidate = new LunarDate({ day: 1, month, year, leap_month: true });
      candidate.init();
      // The upstream constructor can preserve an invalid leap flag. Validate it
      // through the actual solar date rather than trusting the input flag.
      const result = candidate.toSolarDate().toLunarDate().get();
      if (result.leap_month && result.month === month && result.year === year) months.push({ month, leap: true });
    } catch { /* This month has no leap occurrence. */ }
  }
  monthCache.set(year, months);
  return months;
}

export function monthGrid(year: number, month: number): CivilDate[] {
  const first = { year, month, day: 1 };
  const offset = (new Date(stamp(first)).getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => addDays(first, i - offset));
}

const SOLAR_HOLIDAYS: Record<string, string> = {
  '1-1': 'Tết Dương lịch', '30-4': 'Ngày Thống nhất đất nước',
  '1-5': 'Quốc tế Lao động', '2-9': 'Quốc khánh',
};
const LUNAR_HOLIDAYS: Record<string, string> = {
  '1-1': 'Mùng 1 Tết Nguyên đán', '2-1': 'Mùng 2 Tết', '3-1': 'Mùng 3 Tết',
  '15-1': 'Tết Nguyên tiêu', '10-3': 'Giỗ Tổ Hùng Vương',
  '5-5': 'Tết Đoan Ngọ', '15-7': 'Lễ Vu Lan', '15-8': 'Tết Trung thu', '23-12': 'Ông Công, Ông Táo',
};
export function holidays(date: CivilDate, lunar = toLunar(date)): string[] {
  const result: string[] = [];
  const solarName = SOLAR_HOLIDAYS[`${date.day}-${date.month}`];
  const lunarName = !lunar.leap && LUNAR_HOLIDAYS[`${lunar.day}-${lunar.month}`];
  if (solarName) result.push(solarName);
  if (lunarName) result.push(lunarName);
  return result;
}

export function upcomingHolidays(from: CivilDate, count = 3): { date: CivilDate; name: string }[] {
  const result: { date: CivilDate; name: string }[] = [];
  for (let i = 0; i < 370 && result.length < count; i++) {
    const date = addDays(from, i);
    if (!supported(date)) break;
    for (const name of holidays(date)) {
      result.push({ date, name });
      if (result.length === count) break;
    }
  }
  return result;
}
