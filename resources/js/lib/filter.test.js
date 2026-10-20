import { describe, expect, it } from 'vitest';
import { enabledCategories, matchesFilter, parseHiddenCategories } from './filter';

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

describe('parseHiddenCategories', () => {
    const all = ['work', 'meal'];

    it('hides nothing for missing or broken storage', () => {
        expect(parseHiddenCategories(null, all)).toEqual([]);
        expect(parseHiddenCategories('{rusak', all)).toEqual([]);
        expect(parseHiddenCategories('"work"', all)).toEqual([]);
    });

    it('drops unknown categories', () => {
        expect(parseHiddenCategories('["meal","gaming"]', all)).toEqual(['meal']);
        expect(parseHiddenCategories('["foo",1]', all)).toEqual([]);
    });
});

describe('enabledCategories', () => {
    it('shows every category that is not hidden, including ones added later', () => {
        expect(enabledCategories(['meal'], ['work', 'meal', 'study'])).toEqual(['work', 'study']);
    });

    it('can hide everything on purpose', () => {
        expect(enabledCategories(['work', 'meal'], ['work', 'meal'])).toEqual([]);
    });
});
