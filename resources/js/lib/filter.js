export const STORAGE_KEY = 'journaling.categories';

export function matchesFilter(entry, { categories, query }) {
    if (!categories.includes(entry.category)) return false;

    const needle = query.trim().toLowerCase();
    if (!needle) return true;

    return `${entry.title}\n${entry.note ?? ''}`.toLowerCase().includes(needle);
}

export function parseStoredCategories(raw, allValues) {
    if (raw === null) return allValues;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((v) => allValues.includes(v)) : allValues;
    } catch {
        return allValues;
    }
}
