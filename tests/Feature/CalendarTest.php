<?php

namespace Tests\Feature;

use App\Models\Entry;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-10-20 10:00'));
        $this->user = User::factory()->create();
    }

    public function test_week_view_returns_only_own_entries_in_range(): void
    {
        foreach (['2026-10-18', '2026-10-24', '2026-10-25'] as $date) {
            Entry::factory()->for($this->user)->create(['date' => $date]);
        }
        Entry::factory()->create(['date' => '2026-10-20']);

        $this->actingAs($this->user)
            ->get('/calendar?view=week&date=2026-10-20')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Calendar/Index')
                ->where('view', 'week')
                ->where('date', '2026-10-20')
                ->where('range.start', '2026-10-18')
                ->where('range.end', '2026-10-24')
                ->where('today', '2026-10-20')
                ->has('entries', 2)
            );
    }

    public function test_entries_are_sorted_by_date_then_start_time(): void
    {
        Entry::factory()->for($this->user)->create(['date' => '2026-10-21', 'start_time' => '06:00', 'end_time' => '07:00']);
        Entry::factory()->for($this->user)->create(['date' => '2026-10-20', 'start_time' => '14:00', 'end_time' => '15:00']);
        Entry::factory()->for($this->user)->create(['date' => '2026-10-20', 'start_time' => '08:30', 'end_time' => '09:00']);

        $this->actingAs($this->user)
            ->get('/calendar?view=week&date=2026-10-20')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('entries.0.start_time', '08:30')
                ->where('entries.1.start_time', '14:00')
                ->where('entries.2.date', '2026-10-21')
            );
    }

    public function test_month_view_includes_leading_days_from_previous_month(): void
    {
        Entry::factory()->for($this->user)->create(['date' => '2026-09-27']);
        Entry::factory()->for($this->user)->create(['date' => '2026-09-26']);

        $this->actingAs($this->user)
            ->get('/calendar?view=month&date=2026-10-05')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('range.start', '2026-09-27')
                ->has('entries', 1)
                ->where('entries.0.date', '2026-09-27')
            );
    }

    public function test_invalid_query_falls_back_to_week_and_today(): void
    {
        $this->actingAs($this->user)
            ->get('/calendar?view=agenda&date=kemarin')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('view', 'week')
                ->where('date', '2026-10-20')
            );
    }

    public function test_array_query_params_fall_back_instead_of_500(): void
    {
        $this->actingAs($this->user)
            ->get('/calendar?view[]=day&date[]=2026-10-01')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('view', 'week')
                ->where('date', '2026-10-20')
            );
    }

    public function test_default_without_query_is_week_today(): void
    {
        $this->actingAs($this->user)
            ->get('/calendar')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('view', 'week')
                ->where('date', '2026-10-20')
                ->where('range.start', '2026-10-18')
            );
    }
}
