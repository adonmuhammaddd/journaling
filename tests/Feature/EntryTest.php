<?php

namespace Tests\Feature;

use App\Models\Entry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class EntryTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Sarapan',
            'date' => '2026-10-20',
            'start_time' => '07:05',
            'end_time' => '07:40',
            'category' => 'meal',
            'note' => null,
        ], $overrides);
    }

    public function test_user_can_create_entry(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/calendar')
            ->post('/entries', $this->payload())
            ->assertRedirect('/calendar')
            ->assertSessionHas('success', 'Entri disimpan.');

        $this->assertDatabaseHas('entries', [
            'user_id' => $user->id,
            'title' => 'Sarapan',
            'category' => 'meal',
        ]);
    }

    public function test_user_can_update_own_entry(): void
    {
        $entry = Entry::factory()->create();

        $this->actingAs($entry->user)
            ->from('/calendar')
            ->put("/entries/{$entry->id}", $this->payload(['title' => 'Makan siang', 'note' => 'Nasi padang']))
            ->assertRedirect('/calendar')
            ->assertSessionHas('success', 'Entri disimpan.');

        $fresh = $entry->fresh()->toCalendarArray();
        $this->assertSame('Makan siang', $fresh['title']);
        $this->assertSame('Nasi padang', $fresh['note']);
        $this->assertSame('07:05', $fresh['start_time']);
    }

    public function test_user_can_delete_own_entry(): void
    {
        $entry = Entry::factory()->create();

        $this->actingAs($entry->user)
            ->from('/calendar')
            ->delete("/entries/{$entry->id}")
            ->assertRedirect('/calendar')
            ->assertSessionHas('success', 'Entri dihapus.');

        $this->assertModelMissing($entry);
    }

    public function test_cannot_update_or_delete_other_users_entry(): void
    {
        $entry = Entry::factory()->create(['title' => 'Rahasia']);
        $intruder = User::factory()->create();

        $this->actingAs($intruder)->put("/entries/{$entry->id}", $this->payload())->assertNotFound();
        $this->actingAs($intruder)->delete("/entries/{$entry->id}")->assertNotFound();

        $this->assertSame('Rahasia', $entry->fresh()->title);
    }

    public function test_guest_cannot_create_entry(): void
    {
        $this->post('/entries', $this->payload())->assertRedirect(route('login'));
        $this->assertDatabaseCount('entries', 0);
    }

    public function test_guest_cannot_delete_entry(): void
    {
        $entry = Entry::factory()->create();

        $this->delete("/entries/{$entry->id}")->assertRedirect(route('login'));
        $this->assertModelExists($entry);
    }

    public static function invalidPayloads(): array
    {
        return [
            'title kosong' => [['title' => ''], 'title'],
            'title 121' => [['title' => str_repeat('a', 121)], 'title'],
            'tanggal salah' => [['date' => '20-10-2026'], 'date'],
            'jam tanpa nol' => [['start_time' => '9:5'], 'start_time'],
            'jam 24:00' => [['end_time' => '24:00'], 'end_time'],
            'selesai = mulai' => [['start_time' => '10:00', 'end_time' => '10:00'], 'end_time'],
            'selesai < mulai' => [['start_time' => '10:00', 'end_time' => '09:59'], 'end_time'],
            'kategori asing' => [['category' => 'gaming'], 'category'],
            'note terlalu panjang' => [['note' => str_repeat('a', 10001)], 'note'],
        ];
    }

    #[DataProvider('invalidPayloads')]
    public function test_invalid_payload_is_rejected(array $overrides, string $field): void
    {
        $this->actingAs(User::factory()->create())
            ->post('/entries', $this->payload($overrides))
            ->assertSessionHasErrors($field);

        $this->assertDatabaseCount('entries', 0);
    }

    public function test_end_time_2359_is_accepted(): void
    {
        $this->actingAs(User::factory()->create())
            ->post('/entries', $this->payload(['start_time' => '23:00', 'end_time' => '23:59']))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('entries', 1);
    }

    public function test_validation_messages_are_indonesian(): void
    {
        $this->actingAs(User::factory()->create())
            ->post('/entries', $this->payload(['title' => '', 'start_time' => '10:00', 'end_time' => '09:00']))
            ->assertSessionHasErrors([
                'title' => 'Judul wajib diisi.',
                'end_time' => 'Jam selesai harus setelah jam mulai.',
            ]);
    }
}
