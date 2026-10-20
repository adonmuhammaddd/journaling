<?php

namespace App\Http\Controllers;

use App\Http\Requests\EntryRequest;
use App\Models\Entry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class EntryController extends Controller
{
    public function store(EntryRequest $request): RedirectResponse
    {
        $request->user()->entries()->create($request->validated());

        return back()->with('success', 'Entri disimpan.');
    }

    public function update(EntryRequest $request, Entry $entry): RedirectResponse
    {
        Gate::authorize('update', $entry);

        $entry->update($request->validated());

        return back()->with('success', 'Entri disimpan.');
    }

    public function destroy(Entry $entry): RedirectResponse
    {
        Gate::authorize('delete', $entry);

        $entry->delete();

        return back()->with('success', 'Entri dihapus.');
    }
}
