<?php

namespace Tests\Unit;

use App\Enums\Category;
use PHPUnit\Framework\TestCase;

class CategoryTest extends TestCase
{
    public function test_options_lists_all_nine_categories_in_order(): void
    {
        $options = Category::options();

        $this->assertCount(9, $options);
        $this->assertSame(['value' => 'work', 'label' => 'Kerja', 'color' => '#2563EB'], $options[0]);
        $this->assertSame('other', $options[8]['value']);
    }
}
