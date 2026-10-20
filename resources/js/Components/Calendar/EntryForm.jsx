import InputError from '@/Components/InputError';
import { formatDayLong } from '@/lib/dates';
import { nowInJakarta } from '@/lib/time';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { XIcon } from './icons';

const input =
    'block w-full rounded-lg border-slate-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm';
const label = 'mb-1 block text-sm font-medium text-slate-700';

function TimeField({ id, labelText, value, onChange, error }) {
    return (
        <div>
            <label htmlFor={id} className={label}>
                {labelText}
            </label>
            <div className="flex gap-2">
                <input id={id} type="time" step="60" value={value} onChange={(e) => onChange(e.target.value)} className={`${input} h-11`} required />
                <button
                    type="button"
                    onClick={() => onChange(nowInJakarta().time)}
                    className="h-11 shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Sekarang
                </button>
            </div>
            <InputError message={error} className="mt-1" />
        </div>
    );
}

export default function EntryForm({ initial, categories, autoFocus, onClose }) {
    const isEdit = Boolean(initial.id);
    const [confirming, setConfirming] = useState(false);
    const noteRef = useRef(null);

    const { data, setData, post, put, delete: destroy, processing, errors } = useForm({
        title: initial.title ?? '',
        date: initial.date,
        start_time: initial.start_time,
        end_time: initial.end_time,
        category: initial.category ?? 'work',
        note: initial.note ?? '',
    });

    useLayoutEffect(() => {
        const el = noteRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.max(el.scrollHeight, 96)}px`;
    }, [data.note]);

    const options = { preserveScroll: true, preserveState: true, onSuccess: onClose };

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) put(route('entries.update', initial.id), options);
        else post(route('entries.store'), options);
    };

    return (
        <Dialog open onClose={onClose} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
            <div className="fixed inset-0 flex items-end justify-center md:items-center md:p-4">
                <DialogPanel className="flex h-dvh w-full flex-col bg-white md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl md:shadow-xl">
                    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                            <DialogTitle className="text-base font-semibold text-slate-900">
                                {isEdit ? 'Ubah entri' : 'Entri baru'}
                            </DialogTitle>
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                                aria-label="Tutup"
                            >
                                <XIcon />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                            <div>
                                <label htmlFor="title" className={label}>
                                    Judul
                                </label>
                                <input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    maxLength={120}
                                    autoFocus={autoFocus}
                                    placeholder="Lagi ngapain?"
                                    className={`${input} h-11`}
                                    required
                                />
                                <InputError message={errors.title} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="date" className={label}>
                                    Tanggal
                                </label>
                                <input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className={`${input} h-11`}
                                    required
                                />
                                {data.date && <p className="mt-1 text-xs text-slate-500">{formatDayLong(data.date)}</p>}
                                <InputError message={errors.date} className="mt-1" />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <TimeField
                                    id="start_time"
                                    labelText="Jam mulai"
                                    value={data.start_time}
                                    onChange={(v) => setData('start_time', v)}
                                    error={errors.start_time}
                                />
                                <TimeField
                                    id="end_time"
                                    labelText="Jam selesai"
                                    value={data.end_time}
                                    onChange={(v) => setData('end_time', v)}
                                    error={errors.end_time}
                                />
                            </div>

                            <fieldset>
                                <legend className={label}>Kategori</legend>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((c) => {
                                        const selected = data.category === c.value;
                                        return (
                                            <label
                                                key={c.value}
                                                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500"
                                                style={
                                                    selected
                                                        ? { backgroundColor: c.color, borderColor: c.color, color: '#fff' }
                                                        : { borderColor: '#cbd5e1', color: '#334155' }
                                                }
                                            >
                                                <input
                                                    type="radio"
                                                    name="category"
                                                    value={c.value}
                                                    checked={selected}
                                                    onChange={() => setData('category', c.value)}
                                                    className="sr-only"
                                                />
                                                {!selected && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />}
                                                {c.label}
                                            </label>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.category} className="mt-1" />
                            </fieldset>

                            <div>
                                <label htmlFor="note" className={label}>
                                    Catatan
                                </label>
                                <textarea
                                    id="note"
                                    ref={noteRef}
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    maxLength={10000}
                                    placeholder="Ceritakan sedikit (opsional)"
                                    className={`${input} resize-none`}
                                />
                                <InputError message={errors.note} className="mt-1" />
                            </div>
                        </div>

                        <div className="border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                            {confirming ? (
                                <div className="flex items-center gap-2">
                                    <span className="flex-1 text-sm font-medium text-slate-800">Hapus entri ini?</span>
                                    <button
                                        type="button"
                                        onClick={() => setConfirming(false)}
                                        className="h-11 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => destroy(route('entries.destroy', initial.id), options)}
                                        className="h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {isEdit && (
                                        <button
                                            type="button"
                                            onClick={() => setConfirming(true)}
                                            className="h-11 rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                    <span className="flex-1" />
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="h-11 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
