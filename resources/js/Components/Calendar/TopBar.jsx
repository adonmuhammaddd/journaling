import Dropdown from '@/Components/Dropdown';
import { formatMonthShort, formatTitle } from '@/lib/dates';
import { CalendarIcon, ChevronLeft, ChevronRight, MenuIcon } from './icons';

const iconButton =
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export default function TopBar({ view, date, views, isMobile, showMenu, onNavigate, onToday, onMenu, user }) {
    return (
        <header className="flex items-center border-b border-slate-200 bg-white px-1 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
            {showMenu && (
                <button type="button" onClick={onMenu} className={iconButton} aria-label="Buka menu">
                    <MenuIcon />
                </button>
            )}

            <button
                type="button"
                onClick={onToday}
                aria-label="Today"
                className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-3"
            >
                <CalendarIcon />
                <span className="hidden sm:inline">Today</span>
            </button>

            <button type="button" onClick={() => onNavigate(-1)} className={iconButton} aria-label="Sebelumnya">
                <ChevronLeft />
            </button>
            <button type="button" onClick={() => onNavigate(1)} className={iconButton} aria-label="Berikutnya">
                <ChevronRight />
            </button>

            <h1 className="min-w-0 flex-1 truncate px-1 text-sm font-semibold text-slate-900 sm:text-xl">
                {isMobile ? formatMonthShort(date) : formatTitle(view, date)}
            </h1>

            <div className="flex shrink-0 rounded-xl bg-slate-100 p-0.5 sm:p-1" role="tablist" aria-label="Tampilan">
                {views.map((v) => (
                    <button
                        key={v.value}
                        type="button"
                        role="tab"
                        aria-selected={view === v.value}
                        onClick={() => onNavigate(0, v.value)}
                        className={`h-10 rounded-lg px-2.5 text-sm font-medium transition sm:h-9 sm:px-4 ${
                            view === v.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {!isMobile && (
                <Dropdown>
                    <Dropdown.Trigger>
                        <button
                            type="button"
                            className="ml-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-label="Menu akun"
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </button>
                    </Dropdown.Trigger>
                    <Dropdown.Content>
                        <div className="border-b border-slate-100 px-4 py-2 text-sm">
                            <div className="font-medium text-slate-800">{user.name}</div>
                            <div className="truncate text-slate-500">{user.email}</div>
                        </div>
                        <Dropdown.Link href={route('profile.edit')}>Profil</Dropdown.Link>
                        <Dropdown.Link href={route('logout')} method="post" as="button">
                            Keluar
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            )}
        </header>
    );
}
