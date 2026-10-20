import { HOUR_HEIGHT } from '@/lib/layout';

export default function NowLine({ minutes }) {
    return (
        <div
            className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
            style={{ top: (minutes / 60) * HOUR_HEIGHT - 1 }}
            aria-hidden
        >
            <span className="-ml-1.5 h-3 w-3 rounded-full bg-red-500" />
            <span className="h-0.5 flex-1 bg-red-500" />
        </div>
    );
}
