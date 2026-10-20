import Sidebar from '@/Components/Calendar/Sidebar';
import TimeGrid from '@/Components/Calendar/TimeGrid';
import TopBar from '@/Components/Calendar/TopBar';
import Toast from '@/Components/Toast';
import { eachDay, shift } from '@/lib/dates';
import { matchesFilter, parseStoredCategories, STORAGE_KEY } from '@/lib/filter';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const VIEWS = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];

function readStoredCategories(allValues) {
    try {
        return parseStoredCategories(window.localStorage.getItem(STORAGE_KEY), allValues);
    } catch {
        return allValues;
    }
}

export default function CalendarIndex({ view, date, range, today, entries }) {
    const { auth, categories } = usePage().props;
    const [enabled, setEnabled] = useState(() => readStoredCategories(categories.map((c) => c.value)));
    const [query, setQuery] = useState('');
    const [form, setForm] = useState(null);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
        } catch {
            // Storage unavailable (private mode): the filter just won't persist.
        }
    }, [enabled]);

    const visibleEntries = useMemo(
        () => entries.filter((e) => matchesFilter(e, { categories: enabled, query })),
        [entries, enabled, query],
    );

    const navigate = (next) =>
        router.get(
            route('calendar'),
            { view, date, ...next },
            { preserveState: true, preserveScroll: true, only: ['view', 'date', 'range', 'today', 'entries'] },
        );

    const onNavigate = (dir, nextView = view) =>
        navigate({ view: nextView, date: dir === 0 ? date : shift(view, date, dir) });

    return (
        <>
            <Head title="Kalender" />
            <div className="flex h-dvh flex-col bg-white">
                <TopBar
                    view={view}
                    date={date}
                    views={VIEWS}
                    onNavigate={onNavigate}
                    onToday={() => navigate({ date: today })}
                    user={auth.user}
                />

                <div className="flex min-h-0 flex-1">
                    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-slate-200 lg:block">
                        <Sidebar
                            date={date}
                            today={today}
                            highlight={view === 'month' ? null : range}
                            onSelectDate={(d) => navigate({ date: d })}
                            categories={categories}
                            enabled={enabled}
                            onEnabledChange={setEnabled}
                            query={query}
                            onQueryChange={setQuery}
                        />
                    </aside>

                    <main className="flex min-w-0 flex-1 flex-col">
                        {view === 'month' ? (
                            <ul className="space-y-1 overflow-y-auto p-4 text-sm">
                                {visibleEntries.map((e) => (
                                    <li key={e.id}>
                                        {e.date} {e.start_time}–{e.end_time} {e.title}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <TimeGrid
                                days={eachDay(range.start, range.end)}
                                entries={visibleEntries}
                                today={today}
                                categories={categories}
                                onSlotClick={setForm}
                                onEntryClick={setForm}
                            />
                        )}
                    </main>
                </div>
            </div>
            <Toast />
        </>
    );
}
