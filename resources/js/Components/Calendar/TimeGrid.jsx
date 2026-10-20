import { DAY_SHORT, dayOfWeek } from '@/lib/dates';
import { HOUR_HEIGHT, layoutDay } from '@/lib/layout';
import { addMinutes, fromMinutes, nowInJakarta, snap } from '@/lib/time';
import { useEffect, useMemo, useRef, useState } from 'react';
import EntryBlock from './EntryBlock';
import NowLine from './NowLine';

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const LATEST_SLOT_START = 23 * 60 + 29; // keeps a default 30-minute slot inside the day
const SWIPE_DISTANCE = 60;

export default function TimeGrid({ days, entries, today, categories, onSlotClick, onEntryClick, onSwipe, showHeader = true }) {
    const scrollRef = useRef(null);
    const touchRef = useRef(null);
    const [now, setNow] = useState(() => nowInJakarta());

    useEffect(() => {
        const timer = setInterval(() => setNow(nowInJakarta()), 60000);
        return () => clearInterval(timer);
    }, []);

    const colorOf = useMemo(() => Object.fromEntries(categories.map((c) => [c.value, c.color])), [categories]);

    const byDay = useMemo(() => {
        const groups = Object.fromEntries(days.map((d) => [d, []]));
        entries.forEach((e) => groups[e.date]?.push(e));
        return Object.fromEntries(days.map((d) => [d, layoutDay(groups[d])]));
    }, [days, entries]);

    // Scroll to just before "now" when today is visible, otherwise to 07:00.
    useEffect(() => {
        const current = nowInJakarta();
        const hour = days.includes(current.date) ? Math.max(Math.floor(current.minutes / 60) - 1, 0) : 7;
        if (scrollRef.current) scrollRef.current.scrollTop = hour * HOUR_HEIGHT;
    }, [days[0], days.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleColumnClick = (day, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const minutes = Math.min(snap(((e.clientY - rect.top) / HOUR_HEIGHT) * 60), LATEST_SLOT_START);
        const start = fromMinutes(minutes);
        onSlotClick({ date: day, start_time: start, end_time: addMinutes(start, 30) });
    };

    const handleTouchStart = (e) => {
        const t = e.touches[0];
        touchRef.current = { x: t.clientX, y: t.clientY };
    };

    const handleTouchEnd = (e) => {
        if (!onSwipe || !touchRef.current) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchRef.current.x;
        const dy = t.clientY - touchRef.current.y;
        touchRef.current = null;
        if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) onSwipe(dx < 0 ? 1 : -1);
    };

    const columns = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` };

    return (
        <div
            ref={scrollRef}
            className="relative min-h-0 flex-1 overflow-y-auto"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {showHeader && (
                <div className="sticky top-0 z-30 grid border-b border-slate-200 bg-white" style={columns}>
                    <div />
                    {days.map((day) => {
                        const sunday = dayOfWeek(day) === 0;
                        const isToday = day === today;
                        return (
                            <div key={day} className="flex flex-col items-center py-2">
                                <span className={`text-xs font-medium ${sunday ? 'text-red-500' : 'text-slate-500'}`}>
                                    {DAY_SHORT[dayOfWeek(day)]}
                                </span>
                                <span
                                    className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full text-xl ${
                                        isToday ? 'bg-blue-100 font-semibold text-blue-700' : sunday ? 'text-red-500' : 'text-slate-800'
                                    }`}
                                >
                                    {Number(day.slice(8))}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid" style={columns}>
                <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
                    {HOURS.slice(1).map((h) => (
                        <span
                            key={h}
                            className="absolute right-2 -translate-y-1/2 text-[11px] text-slate-400"
                            style={{ top: h * HOUR_HEIGHT }}
                        >
                            {fromMinutes(h * 60)}
                        </span>
                    ))}
                </div>

                {days.map((day) => (
                    <div
                        key={day}
                        onClick={(e) => handleColumnClick(day, e)}
                        className="relative cursor-pointer border-l border-slate-200"
                        style={{
                            height: 24 * HOUR_HEIGHT,
                            backgroundImage: 'linear-gradient(to bottom, rgb(226 232 240) 1px, transparent 1px)',
                            backgroundSize: `100% ${HOUR_HEIGHT}px`,
                        }}
                    >
                        {byDay[day].map((row) => (
                            <EntryBlock
                                key={row.entry.id}
                                {...row}
                                color={colorOf[row.entry.category]}
                                onClick={onEntryClick}
                            />
                        ))}
                        {day === now.date && <NowLine minutes={now.minutes} />}
                    </div>
                ))}
            </div>
        </div>
    );
}
