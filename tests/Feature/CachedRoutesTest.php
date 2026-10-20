<?php

namespace Tests\Feature;

use App\Models\Entry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Production runs `php artisan route:cache`, which skips routes/web.php entirely.
 * These tests boot the app from a cached route file to keep behavior identical.
 */
class CachedRoutesTest extends TestCase
{
    use RefreshDatabase;

    private static string $cachePath;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        self::$cachePath = sys_get_temp_dir().'/journaling-routes-'.uniqid().'.php';
        exec(sprintf(
            'APP_ROUTES_CACHE=%s php %s route:cache 2>&1',
            escapeshellarg(self::$cachePath),
            escapeshellarg(dirname(__DIR__, 2).'/artisan'),
        ));
    }

    public static function tearDownAfterClass(): void
    {
        @unlink(self::$cachePath);
        parent::tearDownAfterClass();
    }

    protected function setUp(): void
    {
        $this->setRoutesCacheEnv(self::$cachePath);
        parent::setUp();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->setRoutesCacheEnv(null);
    }

    private function setRoutesCacheEnv(?string $path): void
    {
        if ($path === null) {
            putenv('APP_ROUTES_CACHE');
            unset($_ENV['APP_ROUTES_CACHE'], $_SERVER['APP_ROUTES_CACHE']);

            return;
        }

        putenv("APP_ROUTES_CACHE={$path}");
        $_ENV['APP_ROUTES_CACHE'] = $_SERVER['APP_ROUTES_CACHE'] = $path;
    }

    public function test_routes_are_loaded_from_cache(): void
    {
        $this->assertFileExists(self::$cachePath);
        $this->assertTrue($this->app->routesAreCached());
    }

    public function test_other_users_entry_is_404_with_cached_routes(): void
    {
        $entry = Entry::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete("/entries/{$entry->id}")
            ->assertNotFound();

        $this->assertModelExists($entry);
    }

    public function test_owner_can_still_delete_with_cached_routes(): void
    {
        $entry = Entry::factory()->create();

        $this->actingAs($entry->user)
            ->from('/calendar')
            ->delete("/entries/{$entry->id}")
            ->assertRedirect('/calendar');

        $this->assertModelMissing($entry);
    }
}
