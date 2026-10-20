import { DAY_SHORT, dayOfWeek, eachDay, rangeFor } from '@/lib/dates';
import { ChevronLeft, ChevronRight } from './icons';

const arrow = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100';

export default function DayStrip({ date, today, onSelect, onShiftWeek }) {
    const { start, end } = rangeFor('week', date);

    return (
        <div className="flex items-center border-b border-slate-200 bg-white px-1 py-1">
            <button type="button" onClick={() => onShiftWeek(-1)} className={arrow} aria-label="Minggu sebelumnya">
                <ChevronLeft />
            </button>
            <div className="grid flex-1 grid-cols-7">
                {eachDay(start, end).map((day) => {
                    const selected = day === date;
                    const sunday = dayOfWeek(day) === 0;
                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => onSelect(day)}
                            aria-current={selected ? 'date' : undefined}
                            className="flex flex-col items-center py-0.5"
                        >
                            <span className={`text-[11px] font-medium ${sunday ? 'text-red-500' : 'text-slate-500'}`}>
                                {DAY_SHORT[dayOfWeek(day)]}
                            </span>
                            <span
                                className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-base ${
                                    selected
                                        ? 'bg-blue-600 font-semibold text-white'
                                        : day === today
                                          ? 'bg-blue-100 font-semibold text-blue-700'
                                          : sunday
                                            ? 'text-red-500'
                                            : 'text-slate-800'
                                }`}
                            >
                                {Number(day.slice(8))}
                            </span>
                        </button>
                    );
                })}
            </div>
            <button type="button" onClick={() => onShiftWeek(1)} className={arrow} aria-label="Minggu berikutnya">
                <ChevronRight />
            </button>
        </div>
    );
}
