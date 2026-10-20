import { describe, expect, it } from 'vitest';
import { addMinutes, fromMinutes, nowInJakarta, snap, toMinutes } from './time';

describe('time', () => {
    it('converts HH:MM to minutes and back', () => {
        expect(toMinutes('09:07')).toBe(547);
        expect(toMinutes('00:00')).toBe(0);
        expect(fromMinutes(547)).toBe('09:07');
        expect(fromMinutes(0)).toBe('00:00');
    });

    it('clamps formatted minutes to the day', () => {
        expect(fromMinutes(1500)).toBe('23:59');
        expect(fromMinutes(-5)).toBe('00:00');
    });

    it('snaps to the nearest or lower 15 minutes', () => {
        expect(snap(547)).toBe(540);
        expect(snap(553)).toBe(555);
        expect(snap(553, 15, 'floor')).toBe(540);
    });

    it('adds minutes without passing 23:59', () => {
        expect(addMinutes('09:00', 30)).toBe('09:30');
        expect(addMinutes('23:45', 30)).toBe('23:59');
    });

    it('reads the current time in Jakarta regardless of the browser timezone', () => {
        // 2026-10-20 23:30 UTC = 2026-10-21 06:30 WIB
        expect(nowInJakarta(new Date(Date.UTC(2026, 9, 20, 23, 30)))).toEqual({
            date: '2026-10-21',
            time: '06:30',
            minutes: 390,
        });
    });
});
