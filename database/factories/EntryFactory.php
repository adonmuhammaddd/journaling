<?php

namespace Database\Factories;

use App\Enums\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Entry>
 */
class EntryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'date' => now()->toDateString(),
            'start_time' => '09:00',
            'end_time' => '10:00',
            'title' => fake()->sentence(3),
            'note' => null,
            'category' => fake()->randomElement(Category::cases()),
        ];
    }
}
