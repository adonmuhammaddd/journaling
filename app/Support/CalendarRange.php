<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Carbon\Exceptions\InvalidFormatException;

final class CalendarRange
{
    public const VIEWS = ['day', 'week', 'month'];

    private function __construct(
        public readonly string $view,
        public readonly CarbonImmutable $date,
        public readonly CarbonImmutable $start,
        public readonly CarbonImmutable $end,
    ) {}

    /**
     * Normalize raw query input and compute the visible date range.
     * Invalid view falls back to week, invalid date falls back to $today.
     */
    public static function make(?string $view, ?string $date, CarbonImmutable $today): self
    {
        $view = in_array($view, self::VIEWS, true) ? $view : 'week';
        $anchor = self::parseDate($date) ?? $today->startOfDay();

        [$start, $end] = match ($view) {
            'day' => [$anchor, $anchor],
            'week' => [
                $anchor->startOfWeek(CarbonInterface::SUNDAY),
                $anchor->endOfWeek(CarbonInterface::SATURDAY),
            ],
            'month' => [
                $anchor->startOfMonth()->startOfWeek(CarbonInterface::SUNDAY),
                $anchor->endOfMonth()->endOfWeek(CarbonInterface::SATURDAY),
            ],
        };

        return new self($view, $anchor, $start->startOfDay(), $end->startOfDay());
    }

    private static function parseDate(?string $date): ?CarbonImmutable
    {
        if ($date === null) {
            return null;
        }

        try {
            $parsed = CarbonImmutable::createFromFormat('!Y-m-d', $date);
        } catch (InvalidFormatException) {
            return null;
        }

        return $parsed && $parsed->format('Y-m-d') === $date ? $parsed : null;
    }
}
