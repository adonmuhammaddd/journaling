export default function CategoryFilter({ categories, enabled, onChange }) {
    const toggle = (value) =>
        onChange(enabled.includes(value) ? enabled.filter((v) => v !== value) : [...enabled, value]);
    const allOn = enabled.length === categories.length;

    return (
        <fieldset>
            <div className="mb-1 flex items-center justify-between">
                <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kategori</legend>
                <button
                    type="button"
                    onClick={() => onChange(allOn ? [] : categories.map((c) => c.value))}
                    className="min-h-9 px-1 text-xs font-medium text-blue-700 hover:underline"
                >
                    {allOn ? 'Sembunyikan semua' : 'Tampilkan semua'}
                </button>
            </div>
            <ul>
                {categories.map((c) => {
                    const checked = enabled.includes(c.value);
                    return (
                        <li key={c.value}>
                            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm text-slate-800 hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(c.value)}
                                    className="h-5 w-5 rounded border-2"
                                    style={{ color: c.color, borderColor: c.color }}
                                />
                                {c.label}
                            </label>
                        </li>
                    );
                })}
            </ul>
        </fieldset>
    );
}
