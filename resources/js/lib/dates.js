// Dates are 'YYYY-MM-DD' strings; arithmetic runs in UTC so the browser timezone never shifts a day.

export const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const DAY_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_MS = 86400000;

function parse(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function format(date) {
    return date.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
    return format(new Date(parse(iso).getTime() + n * DAY_MS));
}

export function dayOfWeek(iso) {
    return parse(iso).getUTCDay();
}

function startOfWeek(iso) {
    return addDays(iso, -dayOfWeek(iso));
}

function endOfMonth(iso) {
    const d = parse(iso);
    return format(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
}

export function rangeFor(view, iso) {
    if (view === 'day') return { start: iso, end: iso };
    if (view === 'month') {
        const last = endOfMonth(iso);
        return { start: startOfWeek(iso.slice(0, 8) + '01'), end: addDays(last, 6 - dayOfWeek(last)) };
    }
    const start = startOfWeek(iso);
    return { start, end: addDays(start, 6) };
}

export function eachDay(start, end) {
    const days = [];
    for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
    return days;
}

export function shift(view, iso, dir) {
    if (view === 'day') return addDays(iso, dir);
    if (view === 'week') return addDays(iso, 7 * dir);
    const d = parse(iso);
    const firstOfTarget = format(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + dir, 1)));
    const lastDay = Number(endOfMonth(firstOfTarget).slice(8));
    return firstOfTarget.slice(0, 8) + String(Math.min(d.getUTCDate(), lastDay)).padStart(2, '0');
}

export function isoWeek(iso) {
    const monday = parse(addDays(startOfWeek(iso), 1));
    const thursday = new Date(monday.getTime() + 3 * DAY_MS);
    const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
    return Math.floor((thursday.getTime() - yearStart) / DAY_MS / 7) + 1;
}

export function formatDayLong(iso) {
    const d = parse(iso);
    return `${DAY_LONG[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatMonth(iso) {
    const d = parse(iso);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatTitle(view, iso) {
    if (view === 'day') return formatDayLong(iso);
    if (view === 'month') return formatMonth(iso);
    return `Minggu ${isoWeek(iso)}, ${formatMonth(startOfWeek(iso))}`;
}
