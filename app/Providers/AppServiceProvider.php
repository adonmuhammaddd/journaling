<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Entries resolve only within the signed-in user's own journal, so others' ids 404.
        // Registered here (not routes/web.php) because route:cache skips the routes file.
        Route::bind('entry', fn (string $value) => request()->user()->entries()->findOrFail($value));
    }
}
