import { describe, expect, it } from 'vitest';
import { addDays, dayOfWeek, eachDay, formatDayLong, formatTitle, isoWeek, rangeFor, shift } from './dates';

describe('dates', () => {
    it('adds days across month and year boundaries', () => {
        expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
        expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    });

    it('returns day of week with Sunday as 0', () => {
        expect(dayOfWeek('2026-10-18')).toBe(0);
        expect(dayOfWeek('2026-10-20')).toBe(2);
    });

    it('computes ranges like the server', () => {
        expect(rangeFor('day', '2026-10-20')).toEqual({ start: '2026-10-20', end: '2026-10-20' });
        expect(rangeFor('week', '2026-10-20')).toEqual({ start: '2026-10-18', end: '2026-10-24' });
        expect(rangeFor('week', '2026-12-31')).toEqual({ start: '2026-12-27', end: '2027-01-02' });
        expect(rangeFor('month', '2026-10-20')).toEqual({ start: '2026-09-27', end: '2026-10-31' });
        expect(rangeFor('month', '2026-02-10')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    });

    it('lists every day in a range', () => {
        expect(eachDay('2026-10-18', '2026-10-24')).toHaveLength(7);
        expect(eachDay('2026-10-20', '2026-10-20')).toEqual(['2026-10-20']);
    });

    it('shifts by view', () => {
        expect(shift('day', '2026-12-31', 1)).toBe('2027-01-01');
        expect(shift('week', '2026-10-20', -1)).toBe('2026-10-13');
        expect(shift('month', '2026-01-31', 1)).toBe('2026-02-28');
        expect(shift('month', '2026-01-15', -1)).toBe('2025-12-15');
    });

    it('numbers weeks by ISO 8601 from the Monday', () => {
        expect(isoWeek('2026-10-20')).toBe(43);
        expect(isoWeek('2026-12-31')).toBe(53);
        expect(isoWeek('2026-10-18')).toBe(43);
    });

    it('formats titles in Indonesian', () => {
        expect(formatTitle('week', '2026-10-20')).toBe('Minggu 43, Oktober 2026');
        expect(formatTitle('week', '2026-10-01')).toBe('Minggu 40, September 2026');
        expect(formatTitle('month', '2026-10-20')).toBe('Oktober 2026');
        expect(formatTitle('day', '2026-10-20')).toBe('Selasa, 20 Oktober 2026');
        expect(formatDayLong('2026-10-18')).toBe('Minggu, 18 Oktober 2026');
    });
});
