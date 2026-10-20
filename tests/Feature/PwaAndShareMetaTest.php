<?php

namespace Tests\Feature;

use Tests\TestCase;

class PwaAndShareMetaTest extends TestCase
{
    public function test_pages_link_the_manifest_and_home_screen_icons(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertSee('<link rel="manifest" href="/manifest.webmanifest">', false)
            ->assertSee('<link rel="apple-touch-icon" href="/apple-touch-icon.png">', false)
            ->assertSee('<meta name="theme-color"', false);
    }

    public function test_pages_carry_open_graph_tags_with_an_absolute_image_url(): void
    {
        config(['app.url' => 'https://journal.dondev.id']);

        $this->get('/login')
            ->assertSee('<meta name="description"', false)
            ->assertSee('<meta property="og:title"', false)
            ->assertSee('<meta property="og:url" content="https://journal.dondev.id">', false)
            ->assertSee('<meta property="og:image" content="https://journal.dondev.id/og-image.png">', false)
            ->assertSee('<meta name="twitter:card" content="summary_large_image">', false);
    }

    public function test_manifest_is_installable_and_its_icons_exist(): void
    {
        $manifest = json_decode(file_get_contents(public_path('manifest.webmanifest')), true, flags: JSON_THROW_ON_ERROR);

        $this->assertSame('standalone', $manifest['display']);
        $this->assertSame('/', $manifest['start_url']);

        $sizes = collect($manifest['icons'])->pluck('sizes')->all();
        $this->assertContains('192x192', $sizes);
        $this->assertContains('512x512', $sizes);
        $this->assertContains('maskable', collect($manifest['icons'])->pluck('purpose')->all());

        foreach ($manifest['icons'] as $icon) {
            $this->assertFileExists(public_path(ltrim($icon['src'], '/')));
        }
    }

    public function test_share_image_and_service_worker_are_published(): void
    {
        $this->assertSame([1200, 630], array_slice(getimagesize(public_path('og-image.png')), 0, 2));
        $this->assertFileExists(public_path('apple-touch-icon.png'));
        $this->assertFileExists(public_path('sw.js'));
        $this->assertFileExists(public_path('offline.html'));
    }
}
