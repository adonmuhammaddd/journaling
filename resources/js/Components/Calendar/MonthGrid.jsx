import { DAY_SHORT, dayOfWeek, eachDay } from '@/lib/dates';
import { useMemo } from 'react';

const MAX_VISIBLE = 3;

export default function MonthGrid({ range, date, today, entries, categories, compact, onDayOpen, onCellCreate, onEntryClick }) {
    const days = eachDay(range.start, range.end);
    const month = date.slice(0, 7);
    const colorOf = useMemo(() => Object.fromEntries(categories.map((c) => [c.value, c.color])), [categories]);

    const byDay = useMemo(() => {
        const groups = {};
        entries.forEach((e) => (groups[e.date] ??= []).push(e));
        return groups;
    }, [entries]);

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-slate-200 bg-white">
                {DAY_SHORT.map((d, i) => (
                    <div key={d} className={`py-2 text-center text-xs font-medium ${i === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                        {d}
                    </div>
                ))}
            </div>

            <div
                className="grid flex-1 grid-cols-7"
                style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(${compact ? '4rem' : '7rem'}, 1fr))` }}
            >
                {days.map((day) => {
                    const items = byDay[day] ?? [];
                    const inMonth = day.startsWith(month);
                    const isToday = day === today;
                    const hidden = items.length - MAX_VISIBLE;

                    return (
                        <div
                            key={day}
                            onClick={() => (compact ? onDayOpen(day) : onCellCreate(day))}
                            className={`min-w-0 cursor-pointer border-b border-r border-slate-200 p-1 ${inMonth ? 'bg-white' : 'bg-slate-50'}`}
                        >
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDayOpen(day);
                                }}
                                className={`mb-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                                    isToday
                                        ? 'bg-blue-600 font-semibold text-white'
                                        : !inMonth
                                          ? 'text-slate-400 hover:bg-slate-100'
                                          : dayOfWeek(day) === 0
                                            ? 'text-red-500 hover:bg-slate-100'
                                            : 'text-slate-700 hover:bg-slate-100'
                                }`}
                                aria-label={`Buka ${day}`}
                            >
                                {Number(day.slice(8))}
                            </button>

                            {compact ? (
                                <div className="flex flex-wrap gap-0.5 px-0.5">
                                    {items.slice(0, 6).map((e) => (
                                        <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colorOf[e.category] }} />
                                    ))}
                                </div>
                            ) : (
                                <ul className="space-y-0.5">
                                    {items.slice(0, MAX_VISIBLE).map((e) => (
                                        <li key={e.id}>
                                            <button
                                                type="button"
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    onEntryClick(e);
                                                }}
                                                className="flex w-full items-center gap-1.5 truncate rounded px-1 py-0.5 text-left text-xs hover:bg-slate-100"
                                            >
                                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colorOf[e.category] }} />
                                                <span className="shrink-0 text-slate-500">{e.start_time}</span>
                                                <span className="truncate text-slate-800">{e.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                    {hidden > 0 && (
                                        <li>
                                            <button
                                                type="button"
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    onDayOpen(day);
                                                }}
                                                className="px-1 text-xs font-medium text-blue-700 hover:underline"
                                            >
                                                +{hidden} lagi
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
