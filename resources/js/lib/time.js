const LAST_MINUTE = 23 * 60 + 59;

const pad = (n) => String(n).padStart(2, '0');

export function toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

export function fromMinutes(min) {
    const clamped = Math.min(Math.max(Math.round(min), 0), LAST_MINUTE);
    return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}`;
}

export function snap(min, step = 15, mode = 'nearest') {
    const fn = mode === 'floor' ? Math.floor : Math.round;
    return fn(min / step) * step;
}

export function addMinutes(hhmm, delta) {
    return fromMinutes(toMinutes(hhmm) + delta);
}

const jakartaFormat = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

// The journal lives in WIB; the browser's own timezone must not leak in.
export function nowInJakarta(now = new Date()) {
    const parts = Object.fromEntries(jakartaFormat.formatToParts(now).map((p) => [p.type, p.value]));
    const time = `${parts.hour}:${parts.minute}`;
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time, minutes: toMinutes(time) };
}
