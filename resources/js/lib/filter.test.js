import { describe, expect, it } from 'vitest';
import { matchesFilter, parseStoredCategories } from './filter';

const entry = { title: 'Rapat tim', note: null, category: 'work' };

describe('matchesFilter', () => {
    it('filters by enabled categories', () => {
        expect(matchesFilter(entry, { categories: ['work'], query: '' })).toBe(true);
        expect(matchesFilter(entry, { categories: ['meal'], query: '' })).toBe(false);
    });

    it('matches title case-insensitively after trimming', () => {
        expect(matchesFilter(entry, { categories: ['work'], query: '  RAPAT ' })).toBe(true);
    });

    it('handles a null note', () => {
        expect(matchesFilter(entry, { categories: ['work'], query: 'kopi' })).toBe(false);
    });

    it('matches inside the note', () => {
        expect(matchesFilter({ ...entry, note: 'minum kopi' }, { categories: ['work'], query: 'kopi' })).toBe(true);
    });
});

describe('parseStoredCategories', () => {
    const all = ['work', 'meal'];

    it('falls back to all categories for missing or broken storage', () => {
        expect(parseStoredCategories(null, all)).toEqual(all);
        expect(parseStoredCategories('{rusak', all)).toEqual(all);
        expect(parseStoredCategories('"work"', all)).toEqual(all);
    });

    it('drops unknown categories', () => {
        expect(parseStoredCategories('["meal","gaming"]', all)).toEqual(['meal']);
    });

    it('keeps an intentionally empty selection', () => {
        expect(parseStoredCategories('[]', all)).toEqual([]);
    });
});
