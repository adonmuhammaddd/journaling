import { describe, expect, it } from 'vitest';
import { blockGeometry, layoutDay } from './layout';

const e = (id, s, t) => ({ id, start_time: s, end_time: t });
const cols = (rows) => rows.map((r) => [r.entry.id, r.column, r.columns]);

describe('blockGeometry', () => {
    it('positions by minutes at 64px per hour', () => {
        expect(blockGeometry(e(1, '09:00', '10:30'))).toEqual({ top: 576, height: 96 });
    });

    it('keeps one-minute entries visible', () => {
        expect(blockGeometry(e(1, '09:00', '09:01')).height).toBe(20);
    });

    it('keeps an entry ending 23:59 inside the grid', () => {
        const { top, height } = blockGeometry(e(1, '23:00', '23:59'));
        expect(top).toBe(1472);
        expect(height).toBeCloseTo(62.933, 2);
        expect(top + height).toBeLessThanOrEqual(24 * 64);
    });
});

describe('layoutDay', () => {
    it('gives touching entries a full column each', () => {
        expect(cols(layoutDay([e(1, '09:00', '10:00'), e(2, '10:00', '11:00')]))).toEqual([[1, 0, 1], [2, 0, 1]]);
    });

    it('splits two overlapping entries side by side', () => {
        expect(cols(layoutDay([e(1, '09:00', '10:00'), e(2, '09:30', '10:30')]))).toEqual([[1, 0, 2], [2, 1, 2]]);
    });

    it('reuses a freed column inside a chained cluster', () => {
        expect(cols(layoutDay([e('A', '09:00', '10:00'), e('B', '09:30', '10:30'), e('C', '10:00', '11:00')])))
            .toEqual([['A', 0, 2], ['B', 1, 2], ['C', 0, 2]]);
    });

    it('sorts unsorted input and keeps geometry', () => {
        const rows = layoutDay([e(2, '14:00', '15:00'), e(1, '08:00', '09:00')]);
        expect(rows.map((r) => r.entry.id)).toEqual([1, 2]);
        expect(rows[0].top).toBe(512);
    });

    it('starts a new cluster after a gap', () => {
        expect(cols(layoutDay([
            e(1, '09:00', '10:00'), e(2, '09:00', '10:00'), e(3, '09:00', '10:00'), e(4, '12:00', '13:00'),
        ]))).toEqual([[1, 0, 3], [2, 1, 3], [3, 2, 3], [4, 0, 1]]);
    });
});
