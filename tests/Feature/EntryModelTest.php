<?php

namespace Tests\Feature;

use App\Models\Entry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EntryModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_entry_serializes_times_as_hh_mm(): void
    {
        $entry = User::factory()->create()->entries()->create([
            'date' => '2026-10-20',
            'start_time' => '09:07',
            'end_time' => '23:59',
            'title' => 'Ngoding',
            'note' => null,
            'category' => 'work',
        ]);

        $data = $entry->fresh()->toCalendarArray();

        $this->assertSame('2026-10-20', $data['date']);
        $this->assertSame('09:07', $data['start_time']);
        $this->assertSame('23:59', $data['end_time']);
        $this->assertSame('work', $data['category']);
        $this->assertNull($data['note']);
    }

    public function test_shared_props_include_categories(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/calendar')
            ->assertInertia(fn ($page) => $page->has('categories', 9)->where('categories.1.value', 'study'));
    }

    public function test_factory_creates_valid_entry(): void
    {
        $this->assertInstanceOf(Entry::class, Entry::factory()->create());
    }
}
