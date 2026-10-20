import DayStrip from '@/Components/Calendar/DayStrip';
import Drawer from '@/Components/Calendar/Drawer';
import EntryForm from '@/Components/Calendar/EntryForm';
import { PlusIcon } from '@/Components/Calendar/icons';
import MonthGrid from '@/Components/Calendar/MonthGrid';
import Sidebar from '@/Components/Calendar/Sidebar';
import TimeGrid from '@/Components/Calendar/TimeGrid';
import TopBar from '@/Components/Calendar/TopBar';
import Toast from '@/Components/Toast';
import useMediaQuery from '@/hooks/useMediaQuery';
import { eachDay, shift } from '@/lib/dates';
import { matchesFilter, parseStoredCategories, STORAGE_KEY } from '@/lib/filter';
import { addMinutes, fromMinutes, nowInJakarta, snap } from '@/lib/time';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const VIEWS = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];
const MOBILE_VIEWS = VIEWS.filter((v) => v.value !== 'week');

function readStoredCategories(allValues) {
    try {
        return parseStoredCategories(window.localStorage.getItem(STORAGE_KEY), allValues);
    } catch {
        return allValues;
    }
}

export default function CalendarIndex({ view, date, range, today, entries }) {
    const { auth, categories } = usePage().props;
    const isMobile = useMediaQuery('(max-width: 767px)');
    const isCompact = useMediaQuery('(max-width: 1023px)');
    const [enabled, setEnabled] = useState(() => readStoredCategories(categories.map((c) => c.value)));
    const [query, setQuery] = useState('');
    const [form, setForm] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

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

    const navigate = (next, options = {}) =>
        router.get(
            route('calendar'),
            { view, date, ...next },
            { preserveState: true, preserveScroll: true, only: ['view', 'date', 'range', 'today', 'entries'], ...options },
        );

    // Phones open on Day view; a 7-column week does not fit, so week links land on Day + DayStrip.
    useEffect(() => {
        const explicitView = new URLSearchParams(window.location.search).has('view');
        if (isMobile && (view === 'week' || !explicitView)) navigate({ view: 'day' }, { replace: true });
    }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

    const onNavigate = (dir, nextView = view) =>
        navigate({ view: nextView, date: dir === 0 ? date : shift(view, date, dir) });

    const selectDate = (d) => {
        setDrawerOpen(false);
        navigate({ date: d });
    };

    const openNewAtNow = () => {
        const now = nowInJakarta();
        const start = date === now.date ? fromMinutes(snap(now.minutes, 15, 'floor')) : '09:00';
        setForm({ date, start_time: start, end_time: addMinutes(start, 30) });
    };

    const sidebar = (
        <Sidebar
            date={date}
            today={today}
            highlight={view === 'month' ? null : range}
            onSelectDate={selectDate}
            categories={categories}
            enabled={enabled}
            onEnabledChange={setEnabled}
            query={query}
            onQueryChange={setQuery}
        />
    );

    return (
        <>
            <Head title="Kalender" />
            <div className="flex h-dvh flex-col bg-white">
                <TopBar
                    view={view}
                    date={date}
                    views={isMobile ? MOBILE_VIEWS : VIEWS}
                    isMobile={isMobile}
                    showMenu={isCompact}
                    onNavigate={onNavigate}
                    onToday={() => navigate({ date: today })}
                    onMenu={() => setDrawerOpen(true)}
                    user={auth.user}
                />

                {isMobile && view === 'day' && (
                    <DayStrip
                        date={date}
                        today={today}
                        onSelect={(d) => navigate({ date: d })}
                        onShiftWeek={(dir) => navigate({ date: shift('week', date, dir) })}
                    />
                )}

                <div className="flex min-h-0 flex-1">
                    {!isCompact && (
                        <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-200">{sidebar}</aside>
                    )}

                    <main className="flex min-w-0 flex-1 flex-col">
                        {view === 'month' ? (
                            <MonthGrid
                                range={range}
                                date={date}
                                today={today}
                                entries={visibleEntries}
                                categories={categories}
                                compact={isMobile}
                                onDayOpen={(d) => navigate({ view: 'day', date: d })}
                                onCellCreate={(d) => setForm({ date: d, start_time: '09:00', end_time: '09:30' })}
                                onEntryClick={setForm}
                            />
                        ) : (
                            <TimeGrid
                                days={eachDay(range.start, range.end)}
                                entries={visibleEntries}
                                today={today}
                                categories={categories}
                                showHeader={!(isMobile && view === 'day')}
                                onSlotClick={setForm}
                                onEntryClick={setForm}
                                onSwipe={view === 'day' ? (dir) => navigate({ date: shift('day', date, dir) }) : undefined}
                            />
                        )}
                    </main>
                </div>
            </div>

            <button
                type="button"
                onClick={openNewAtNow}
                aria-label="Tambah entri"
                className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
                <PlusIcon width={28} height={28} />
            </button>

            {isCompact && (
                <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={auth.user}>
                    {sidebar}
                </Drawer>
            )}

            {form && (
                <EntryForm
                    initial={form}
                    categories={categories}
                    autoFocus={!form.id && !isMobile}
                    onClose={() => setForm(null)}
                />
            )}
            <Toast />
        </>
    );
}
