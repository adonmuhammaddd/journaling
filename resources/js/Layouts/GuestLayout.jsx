import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-dvh flex-col items-center bg-slate-100 px-4 pt-10 sm:justify-center sm:pt-0">
            <Link href="/" className="flex items-center gap-3">
                <ApplicationLogo className="h-12 w-12 fill-current text-blue-600" />
                <span className="text-2xl font-semibold text-slate-900">Journaling</span>
            </Link>

            <div className="mt-6 w-full overflow-hidden rounded-2xl bg-white px-6 py-6 shadow-md sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
