import CategoryFilter from './CategoryFilter';
import { SearchIcon } from './icons';
import MiniCalendar from './MiniCalendar';

export default function Sidebar({ date, today, highlight, onSelectDate, categories, enabled, onEnabledChange, query, onQueryChange }) {
    return (
        <div className="flex flex-col gap-5 p-4">
            <MiniCalendar selected={date} today={today} highlight={highlight} onSelect={onSelectDate} />

            <label className="relative block">
                <span className="sr-only">Filter entri</span>
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Filter entri"
                    className="h-11 w-full rounded-lg border-slate-300 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </label>

            <CategoryFilter categories={categories} enabled={enabled} onChange={onEnabledChange} />
        </div>
    );
}
