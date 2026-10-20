<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Demo account with a week of entries around today, for local development only.
     */
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Demo',
            'email' => 'demo@journaling.test',
        ]);

        $sunday = CarbonImmutable::today()->startOfWeek(CarbonImmutable::SUNDAY);

        foreach (range(0, 6) as $offset) {
            $date = $sunday->addDays($offset)->toDateString();

            $user->entries()->createMany([
                ['date' => $date, 'start_time' => '07:00', 'end_time' => '07:30', 'title' => 'Sarapan', 'category' => 'meal'],
                ['date' => $date, 'start_time' => '12:00', 'end_time' => '12:45', 'title' => 'Makan siang', 'category' => 'meal'],
            ]);

            if ($offset >= 1 && $offset <= 5) {
                $user->entries()->createMany([
                    ['date' => $date, 'start_time' => '09:00', 'end_time' => '09:15', 'title' => 'Daily standup', 'category' => 'work'],
                    ['date' => $date, 'start_time' => '09:15', 'end_time' => '11:50', 'title' => 'Ngoding fitur', 'category' => 'work', 'note' => "Lanjut task kemarin.\nCek PR teman."],
                    ['date' => $date, 'start_time' => '13:00', 'end_time' => '17:00', 'title' => 'Review & meeting', 'category' => 'work'],
                ]);
            }
        }

        $tuesday = $sunday->addDays(2)->toDateString();
        $user->entries()->createMany([
            ['date' => $tuesday, 'start_time' => '14:00', 'end_time' => '15:30', 'title' => 'Kursus Jerman', 'category' => 'study'],
            ['date' => $tuesday, 'start_time' => '15:00', 'end_time' => '16:00', 'title' => 'Telepon ibu', 'category' => 'personal'],
            ['date' => $tuesday, 'start_time' => '18:30', 'end_time' => '18:31', 'title' => 'Minum vitamin', 'category' => 'other'],
            ['date' => $tuesday, 'start_time' => '19:00', 'end_time' => '20:00', 'title' => 'Lari sore', 'category' => 'exercise'],
            ['date' => $sunday->toDateString(), 'start_time' => '16:00', 'end_time' => '21:00', 'title' => 'Kumpul keluarga', 'category' => 'social'],
            ['date' => $sunday->addDays(6)->toDateString(), 'start_time' => '22:30', 'end_time' => '23:59', 'title' => 'Tidur', 'category' => 'rest'],
        ]);
    }
}
