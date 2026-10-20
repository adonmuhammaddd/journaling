<?php

namespace App\Models;

use App\Enums\Category;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Entry extends Model
{
    /** @use HasFactory<\Database\Factories\EntryFactory> */
    use HasFactory;

    protected $fillable = [
        'date',
        'start_time',
        'end_time',
        'title',
        'note',
        'category',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'category' => Category::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array{id: int, date: string, start_time: string, end_time: string, title: string, note: ?string, category: string}
     */
    public function toCalendarArray(): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date->format('Y-m-d'),
            'start_time' => substr($this->start_time, 0, 5),
            'end_time' => substr($this->end_time, 0, 5),
            'title' => $this->title,
            'note' => $this->note,
            'category' => $this->category->value,
        ];
    }
}
