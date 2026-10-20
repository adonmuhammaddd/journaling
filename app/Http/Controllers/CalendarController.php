<?php

namespace App\Http\Controllers;

use App\Models\Entry;
use App\Support\CalendarRange;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function show(Request $request): Response
    {
        $today = CarbonImmutable::today();
        // Query values can arrive as arrays (?view[]=x); anything non-string falls back to defaults.
        $query = fn (string $key) => is_string($value = $request->query($key)) ? $value : null;
        $range = CalendarRange::make($query('view'), $query('date'), $today);

        $entries = $request->user()->entries()
            ->whereBetween('date', [$range->start->toDateString(), $range->end->toDateString()])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(fn (Entry $entry) => $entry->toCalendarArray());

        return Inertia::render('Calendar/Index', [
            'view' => $range->view,
            'date' => $range->date->toDateString(),
            'range' => [
                'start' => $range->start->toDateString(),
                'end' => $range->end->toDateString(),
            ],
            'today' => $today->toDateString(),
            'entries' => $entries,
        ]);
    }
}
