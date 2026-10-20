import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { XIcon } from './icons';

export default function Drawer({ open, onClose, user, children }) {
    return (
        <Dialog open={open} onClose={onClose} className="relative z-40">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-slate-900/40 transition-opacity duration-200 data-[closed]:opacity-0"
            />
            <DialogPanel
                transition
                className="fixed inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl transition duration-200 data-[closed]:-translate-x-full"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                    <span className="font-semibold text-slate-900">Journaling</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                        aria-label="Tutup menu"
                    >
                        <XIcon />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
                <div className="border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm">
                    <div className="mb-2 truncate text-slate-500">{user.email}</div>
                    <div className="flex gap-2">
                        <Link
                            href={route('profile.edit')}
                            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 font-medium text-slate-700"
                        >
                            Profil
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 font-medium text-slate-700"
                        >
                            Keluar
                        </Link>
                    </div>
                </div>
            </DialogPanel>
        </Dialog>
    );
}
