<?php

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\EntryController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// Entries resolve only within the signed-in user's own journal, so others' ids 404.
Route::bind('entry', fn (string $value) => request()->user()->entries()->findOrFail($value));

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('calendar')
        : redirect()->route('login');
})->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/calendar', [CalendarController::class, 'show'])->name('calendar');

    Route::post('/entries', [EntryController::class, 'store'])->name('entries.store');
    Route::put('/entries/{entry}', [EntryController::class, 'update'])->name('entries.update');
    Route::delete('/entries/{entry}', [EntryController::class, 'destroy'])->name('entries.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
