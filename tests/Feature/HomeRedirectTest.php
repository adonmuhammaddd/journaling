<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_on_home_is_redirected_to_login(): void
    {
        $this->get('/')->assertRedirect(route('login'));
    }

    public function test_user_on_home_is_redirected_to_calendar(): void
    {
        $this->actingAs(User::factory()->create())->get('/')->assertRedirect(route('calendar'));
    }

    public function test_guest_cannot_open_calendar(): void
    {
        $this->get('/calendar')->assertRedirect(route('login'));
    }
}
