export default function EntryBlock({ entry, top, height, column, columns, color, onClick }) {
    const compact = height < 36;

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick(entry);
            }}
            title={`${entry.start_time}–${entry.end_time} ${entry.title}`}
            className="absolute flex flex-col justify-start overflow-hidden rounded-md px-1.5 text-left text-xs leading-tight shadow-sm transition hover:z-10 hover:shadow-md focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            style={{
                top,
                height: height - 2,
                left: `calc(${(column / columns) * 100}% + 2px)`,
                width: `calc(${100 / columns}% - 4px)`,
                borderLeft: `4px solid ${color}`,
                backgroundColor: `${color}1F`,
            }}
        >
            {compact ? (
                <span className="block truncate py-0.5">
                    <span className="font-semibold" style={{ color }}>
                        {entry.start_time}
                    </span>{' '}
                    <span className="text-slate-800">{entry.title}</span>
                </span>
            ) : (
                <span className="block py-1">
                    <span className="block font-semibold" style={{ color }}>
                        {entry.start_time}
                    </span>
                    <span className="line-clamp-3 text-sm font-medium text-slate-800">{entry.title}</span>
                </span>
            )}
        </button>
    );
}
