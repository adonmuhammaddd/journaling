import { DAY_SHORT, eachDay, formatMonth, rangeFor, shift } from '@/lib/dates';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from './icons';

const navButton = 'inline-flex h-9 w-9 items-center justify-center rounded-full text-blue-800 hover:bg-slate-100';

export default function MiniCalendar({ selected, today, highlight, onSelect }) {
    const [cursor, setCursor] = useState(selected);

    useEffect(() => setCursor(selected), [selected]);

    const month = cursor.slice(0, 7);
    const { start, end } = rangeFor('month', cursor);
    const move = (months) => setCursor((c) => shift('month', c, months));

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <button type="button" className={navButton} onClick={() => move(-12)} aria-label="Tahun sebelumnya">
                    <ChevronsLeft />
                </button>
                <button type="button" className={navButton} onClick={() => move(-1)} aria-label="Bulan sebelumnya">
                    <ChevronLeft />
                </button>
                <div className="flex-1 text-center text-sm font-semibold text-blue-900">{formatMonth(cursor)}</div>
                <button type="button" className={navButton} onClick={() => move(1)} aria-label="Bulan berikutnya">
                    <ChevronRight />
                </button>
                <button type="button" className={navButton} onClick={() => move(12)} aria-label="Tahun berikutnya">
                    <ChevronsRight />
                </button>
            </div>

            <div className="grid grid-cols-7 text-center text-xs">
                {DAY_SHORT.map((d) => (
                    <div key={d} className="py-1 text-[11px] font-medium text-slate-500">
                        {d}
                    </div>
                ))}
                {eachDay(start, end).map((day) => {
                    const inMonth = day.startsWith(month);
                    const inHighlight = highlight && day >= highlight.start && day <= highlight.end;
                    return (
                        <div key={day} className={`py-0.5 ${inHighlight ? 'bg-blue-50' : ''}`}>
                            <button
                                type="button"
                                onClick={() => onSelect(day)}
                                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                                    day === selected
                                        ? 'bg-blue-600 font-semibold text-white'
                                        : day === today
                                          ? 'font-semibold text-blue-700 ring-1 ring-blue-300'
                                          : inMonth
                                            ? 'text-slate-700 hover:bg-slate-100'
                                            : 'text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                {Number(day.slice(8))}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
