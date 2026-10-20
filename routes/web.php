<?php

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('calendar')
        : redirect()->route('login');
})->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/calendar', [CalendarController::class, 'show'])->name('calendar');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
