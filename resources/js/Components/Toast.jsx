import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Toast() {
    const { flash } = usePage().props;
    const [message, setMessage] = useState(null);

    // `flash` is a fresh object on every full response, so repeated messages still show.
    useEffect(() => {
        if (!flash?.success) return;
        setMessage(flash.success);
        const timer = setTimeout(() => setMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [flash]);

    if (!message) return null;

    return (
        <div role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-6">
            <div className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{message}</div>
        </div>
    );
}
