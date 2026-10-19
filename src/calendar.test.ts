import { describe, expect, it } from 'vitest';
import { addDays, dateKey, holidays, lunarMonths, monthGrid, shiftMonth, solarText, stamp, supported, todayInVietnam, toLunar, toSolar, validSolar } from './calendar';

describe('Vietnamese lunar calendar reference dates', () => {
  // Public references and provenance are documented in docs/VALIDATION.md.
  const cases = [
    [{ day: 29, month: 1, year: 1968 }, { day: 1, month: 1, year: 1968, leap: false }],
    [{ day: 21, month: 1, year: 1985 }, { day: 1, month: 1, year: 1985, leap: false }],
    [{ day: 22, month: 1, year: 2023 }, { day: 1, month: 1, year: 2023, leap: false }],
    [{ day: 20, month: 2, year: 2023 }, { day: 1, month: 2, year: 2023, leap: false }],
    [{ day: 22, month: 3, year: 2023 }, { day: 1, month: 2, year: 2023, leap: true }],
    [{ day: 25, month: 7, year: 2025 }, { day: 1, month: 6, year: 2025, leap: true }],
    [{ day: 17, month: 2, year: 2026 }, { day: 1, month: 1, year: 2026, leap: false }],
    [{ day: 25, month: 9, year: 2026 }, { day: 15, month: 8, year: 2026, leap: false }],
    [{ day: 6, month: 2, year: 2027 }, { day: 1, month: 1, year: 2027, leap: false }],
  ] as const;
  for (const [solar, lunar] of cases) it(`${solarText(solar)} converts in both directions`, () => {
    expect(toLunar(solar)).toMatchObject(lunar);
    expect(toSolar(lunar)).toEqual(solar);
  });
  it('uses the lunar year at the Tet boundary', () => {
    expect(toLunar({ day: 16, month: 2, year: 2026 }).yearName).toBe('Ất Tỵ');
    expect(toLunar({ day: 17, month: 2, year: 2026 }).yearName).toBe('Bính Ngọ');
  });
});

describe('full supported range', () => {
  it('round-trips every solar day from 1900 through 2100 with continuous lunar days', () => {
    let date = { day: 1, month: 1, year: 1900 };
    let previous: ReturnType<typeof toLunar> | null = null;
    let count = 0;
    while (date.year <= 2100) {
      const lunar = toLunar(date);
      const result = toSolar(lunar);
      if (dateKey(result) !== dateKey(date)) throw new Error(`Round-trip failed: ${dateKey(date)}`);
      if (lunar.day < 1 || lunar.day > 30 || lunar.month < 1 || lunar.month > 12) throw new Error(`Invalid lunar result: ${dateKey(date)}`);
      if (previous && lunar.day !== previous.day + 1 && !(lunar.day === 1 && previous.day >= 29)) throw new Error(`Discontinuous day: ${dateKey(date)}`);
      previous = lunar;
      date = addDays(date, 1); count++;
    }
    expect(count).toBe(73414);
  }, 30_000);
  it('enumerates 12 or 13 months, including only valid leap months', () => {
    for (let year = 1900; year <= 2100; year++) {
      const months = lunarMonths(year);
      expect([12, 13]).toContain(months.length);
      expect(months.filter(m => m.leap).length).toBeLessThanOrEqual(1);
    }
    expect(lunarMonths(2023)).toContainEqual({ month: 2, leap: true });
    expect(lunarMonths(2025)).toContainEqual({ month: 6, leap: true });
    expect(lunarMonths(2026)).toHaveLength(12);
  });
});

describe('invalid dates and boundaries', () => {
  it('rejects invalid Gregorian dates and fractional inputs', () => {
    expect(validSolar({ day: 29, month: 2, year: 1900 })).toBe(false);
    expect(validSolar({ day: 29, month: 2, year: 2000 })).toBe(true);
    expect(validSolar({ day: 29, month: 2, year: 2100 })).toBe(false);
    expect(validSolar({ day: 31, month: 4, year: 2026 })).toBe(false);
    expect(validSolar({ day: 1.2, month: 1, year: 2026 })).toBe(false);
    expect(supported({ day: 31, month: 12, year: 1899 })).toBe(false);
  });
  it('rejects non-existent lunar months and overflowing lunar days', () => {
    expect(() => toSolar({ day: 1, month: 2, year: 2026, leap: true })).toThrow();
    expect(() => toSolar({ day: 1, month: 3, year: 2023, leap: true })).toThrow();
    expect(() => toSolar({ day: 30, month: 2, year: 2023, leap: true })).toThrow();
    expect(() => toSolar({ day: 31, month: 1, year: 2026, leap: false })).toThrow();
    expect(() => toSolar({ day: 1, month: 1, year: 1899, leap: false })).toThrow(/phạm vi/);
    expect(() => toSolar({ day: 29, month: 12, year: 2100, leap: false })).toThrow(/phạm vi/);
  });
  it('supports the part of lunar year 1899 occurring in January 1900', () => {
    const date = { day: 1, month: 1, year: 1900 };
    expect(toLunar(date).year).toBe(1899);
    expect(toSolar(toLunar(date))).toEqual(date);
  });
});

describe('civil dates, timezone and holiday behavior', () => {
  it('gets today from UTC+7, independently of the host timezone', () => {
    expect(todayInVietnam(new Date('2026-10-19T16:59:59Z'))).toEqual({ day: 19, month: 10, year: 2026 });
    expect(todayInVietnam(new Date('2026-10-19T17:00:00Z'))).toEqual({ day: 20, month: 10, year: 2026 });
  });
  it('creates a Monday-first grid and clamps month navigation', () => {
    const grid = monthGrid(2026, 10);
    expect(grid).toHaveLength(42);
    expect(new Date(stamp(grid[0])).getUTCDay()).toBe(1);
    expect(shiftMonth({ day: 31, month: 1, year: 2024 }, 1)).toEqual({ day: 29, month: 2, year: 2024 });
    expect(monthGrid(1900, 1).some(supported)).toBe(true);
    expect(monthGrid(2100, 12).some(d => !supported(d))).toBe(true);
  });
  it('does not duplicate traditional holidays in leap months', () => {
    expect(holidays({ day: 17, month: 2, year: 2026 })).toContain('Mùng 1 Tết Nguyên đán');
    expect(holidays({ day: 25, month: 9, year: 2026 })).toContain('Tết Trung thu');
    expect(holidays({ day: 1, month: 1, year: 2026 })).toContain('Tết Dương lịch');
    expect(holidays({ day: 19, month: 10, year: 2026 }, { day: 15, month: 8, year: 2026, leap: true, yearName: 'Bính Ngọ' })).not.toContain('Tết Trung thu');
  });
});
