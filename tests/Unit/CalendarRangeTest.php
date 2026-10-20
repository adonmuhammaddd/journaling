<?php

namespace Tests\Unit;

use App\Support\CalendarRange;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class CalendarRangeTest extends TestCase
{
    // [view, date, expectedView, expectedStart, expectedEnd]
    public static function ranges(): array
    {
        return [
            'day' => ['day', '2026-10-20', 'day', '2026-10-20', '2026-10-20'],
            'week mid' => ['week', '2026-10-20', 'week', '2026-10-18', '2026-10-24'],
            'week on sunday' => ['week', '2026-10-18', 'week', '2026-10-18', '2026-10-24'],
            'week across year' => ['week', '2026-12-31', 'week', '2026-12-27', '2027-01-02'],
            'month october' => ['month', '2026-10-20', 'month', '2026-09-27', '2026-10-31'],
            'month feb 4 weeks' => ['month', '2026-02-10', 'month', '2026-02-01', '2026-02-28'],
            'bad view' => ['year', '2026-10-20', 'week', '2026-10-18', '2026-10-24'],
            'bad date' => ['day', '2026-13-45', 'day', '2026-10-20', '2026-10-20'],
            'nulls' => [null, null, 'week', '2026-10-18', '2026-10-24'],
            'garbage date' => ['day', 'kemarin', 'day', '2026-10-20', '2026-10-20'],
        ];
    }

    #[DataProvider('ranges')]
    public function test_make(?string $view, ?string $date, string $expectedView, string $expectedStart, string $expectedEnd): void
    {
        $range = CalendarRange::make($view, $date, CarbonImmutable::parse('2026-10-20'));

        $this->assertSame($expectedView, $range->view);
        $this->assertSame($expectedStart, $range->start->toDateString());
        $this->assertSame($expectedEnd, $range->end->toDateString());
    }

    public function test_anchor_date_is_kept(): void
    {
        $range = CalendarRange::make('week', '2026-10-22', CarbonImmutable::parse('2026-10-20'));

        $this->assertSame('2026-10-22', $range->date->toDateString());
    }
}
