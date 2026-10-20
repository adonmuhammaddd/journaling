const base = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
};

export const ChevronLeft = (p) => <svg {...base} {...p}><path d="m15 18-6-6 6-6" /></svg>;
export const ChevronRight = (p) => <svg {...base} {...p}><path d="m9 18 6-6-6-6" /></svg>;
export const ChevronsLeft = (p) => <svg {...base} {...p}><path d="m11 17-5-5 5-5M18 17l-5-5 5-5" /></svg>;
export const ChevronsRight = (p) => <svg {...base} {...p}><path d="m13 17 5-5-5-5M6 17l5-5-5-5" /></svg>;
export const CalendarIcon = (p) => (
    <svg {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
export const MenuIcon = (p) => <svg {...base} {...p}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
export const PlusIcon = (p) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const XIcon = (p) => <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
export const SearchIcon = (p) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
