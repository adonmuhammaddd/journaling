<?php

namespace App\Enums;

enum Category: string
{
    case Work = 'work';
    case Study = 'study';
    case Meal = 'meal';
    case Exercise = 'exercise';
    case Rest = 'rest';
    case Social = 'social';
    case Travel = 'travel';
    case Personal = 'personal';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Work => 'Kerja',
            self::Study => 'Belajar',
            self::Meal => 'Makan',
            self::Exercise => 'Olahraga',
            self::Rest => 'Istirahat',
            self::Social => 'Sosial',
            self::Travel => 'Perjalanan',
            self::Personal => 'Pribadi',
            self::Other => 'Lainnya',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Work => '#2563EB',
            self::Study => '#7C3AED',
            self::Meal => '#F59E0B',
            self::Exercise => '#16A34A',
            self::Rest => '#0891B2',
            self::Social => '#C026D3',
            self::Travel => '#EA580C',
            self::Personal => '#E11D48',
            self::Other => '#64748B',
        };
    }

    /**
     * @return array<int, array{value: string, label: string, color: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $c) => [
            'value' => $c->value,
            'label' => $c->label(),
            'color' => $c->color(),
        ], self::cases());
    }
}
