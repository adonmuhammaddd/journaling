import { toMinutes } from './time';

export const HOUR_HEIGHT = 64;
export const MIN_BLOCK_HEIGHT = 20;

export function blockGeometry(entry) {
    const start = toMinutes(entry.start_time);
    const end = toMinutes(entry.end_time);
    return {
        top: (start / 60) * HOUR_HEIGHT,
        height: Math.max(((end - start) / 60) * HOUR_HEIGHT, MIN_BLOCK_HEIGHT),
    };
}

const MIN_BLOCK_MINUTES = (MIN_BLOCK_HEIGHT / HOUR_HEIGHT) * 60;

// Lays out one day's entries: overlapping entries form a cluster and share its width
// in columns; touching entries (10:00 end, 10:00 start) do not overlap. Overlap uses the
// drawn end, so a short entry stretched to the minimum height is not hidden by the next one.
export function layoutDay(entries) {
    const items = entries
        .map((entry) => {
            const start = toMinutes(entry.start_time);
            return { entry, start, end: Math.max(toMinutes(entry.end_time), start + MIN_BLOCK_MINUTES) };
        })
        .sort((a, b) => a.start - b.start || b.end - a.end);

    const rows = [];
    let cluster = [];
    let columnEnds = [];
    let clusterEnd = -1;

    const closeCluster = () => {
        cluster.forEach((row) => (row.columns = columnEnds.length));
        cluster = [];
        columnEnds = [];
    };

    for (const item of items) {
        if (item.start >= clusterEnd) closeCluster();

        let column = columnEnds.findIndex((end) => end <= item.start);
        if (column === -1) column = columnEnds.length;
        columnEnds[column] = item.end;
        clusterEnd = Math.max(clusterEnd, item.end);

        const row = { entry: item.entry, ...blockGeometry(item.entry), column, columns: 1 };
        cluster.push(row);
        rows.push(row);
    }
    closeCluster();

    return rows;
}
