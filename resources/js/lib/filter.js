export const STORAGE_KEY = 'journaling.hiddenCategories';

export function matchesFilter(entry, { categories, query }) {
    if (!categories.includes(entry.category)) return false;

    const needle = query.trim().toLowerCase();
    if (!needle) return true;

    return `${entry.title}\n${entry.note ?? ''}`.toLowerCase().includes(needle);
}

// Storage keeps the categories the user hid (not the ones shown), so a category added
// in a later release is visible by default and junk in storage hides nothing.
export function parseHiddenCategories(raw, allValues) {
    if (raw === null) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((v) => allValues.includes(v)) : [];
    } catch {
        return [];
    }
}

export function enabledCategories(hidden, allValues) {
    return allValues.filter((v) => !hidden.includes(v));
}
