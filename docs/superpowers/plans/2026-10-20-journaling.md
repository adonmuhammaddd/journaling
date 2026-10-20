# Journaling App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app journaling multi-user: login, catat aktivitas sebagai blok waktu presisi menit + catatan, tampil di kalender Day/Week/Month, nyaman di HP.

**Architecture:** Laravel 12 + Breeze (React/Inertia) menyimpan satu tabel `entries` (DATE + TIME). Server menghitung rentang tanggal per view dan mengirim entri dalam rentang itu ke satu halaman Inertia `Calendar/Index`. Semua hitungan tanggal, jam, posisi blok, dan filter di frontend ada di fungsi murni `resources/js/lib/*.js` (dites Vitest); komponen React cuma merender.

**Tech Stack:** PHP 8.2+, Laravel 12, Breeze 2 (react, JSX, PHPUnit), Inertia v2, React 18, Tailwind 3 + @tailwindcss/forms, Ziggy, Vite 7, Vitest, sqlite (dev/test), MySQL (prod).

**Spec:** `docs/superpowers/specs/2026-10-20-journaling-design.md`

## Global Constraints

- Timezone app `Asia/Jakarta`; `APP_LOCALE=id`; semua teks UI Bahasa Indonesia, label teknis (Day/Week/Month, Today) boleh Inggris seperti di spec.
- Format jam 24 jam `HH:MM`. Tanggal di props/URL selalu `YYYY-MM-DD`.
- Minggu dimulai hari **Minggu** (Sun–Sat). Nomor minggu = ISO 8601 dari hari Senin minggu itu.
- Node ≥ 22.12 (`.nvmrc` berisi `22.12.0`).
- Tanpa dependency baru di luar: Breeze bawaan, `vitest`. Tidak ada library kalender/tanggal.
- Kategori hanya dari enum `App\Enums\Category` (9 nilai, lihat spec §3.2). Frontend membaca daftarnya dari shared prop `categories`.
- Entri user lain selalu 404.
- Tinggi jam di grid `64px`, tinggi blok minimum `20px`, snap slot `15` menit, durasi default `30` menit, batas jam `23:59`.
- Breakpoint: mobile `< 768px`, tablet `768–1023px`, desktop `≥ 1024px`.
- Jangan pakai `window.confirm`/`alert`. `localStorage` selalu dibungkus try/catch.
- Commit tanpa trailer co-author Claude (preferensi Don).
- Di shell sesi ini `grep` adalah shell function yang rusak; pakai `/usr/bin/grep`.

## Review Focus

1. **Browser user tidak di WIB** (laptop set ke timezone lain): garis "sekarang", tombol "Sekarang", dan "hari ini" tetap mengikuti WIB. Dites di Task 6 (`nowInJakarta`).
2. **Pergantian tahun & bulan pendek**: minggu 27 Des 2026–2 Jan 2027 (ISO week 53), Februari 2026 yang pas 4 minggu, navigasi bulan dari 31 Januari. Dites di Task 3 dan Task 6.
3. **Entri ekstrem**: entri 1 menit tetap terlihat (tinggi 20px), entri yang berakhir 23:59 tidak keluar grid, entri bersentuhan (selesai 10:00, mulai 10:00) tidak dianggap bentrok. Dites di Task 7.
4. **Filter dengan data kotor**: `note` null saat cari teks, isi `localStorage` rusak atau berisi kategori yang tidak dikenal. Dites di Task 7 (`filter.js`).
5. **Batas validasi jam**: `end_time == start_time` ditolak, `23:59` diterima, `24:00` dan `9:5` ditolak. Dites di Task 5.

---

## File Structure

```
app/Enums/Category.php                      enum kategori: label(), color(), options()
app/Support/CalendarRange.php               normalisasi view/date + hitung rentang
app/Models/Entry.php                        model + toCalendarArray()
app/Http/Controllers/CalendarController.php GET /calendar
app/Http/Controllers/EntryController.php    store/update/destroy
app/Http/Requests/EntryRequest.php          validasi
app/Policies/EntryPolicy.php                update/delete milik sendiri
app/Http/Middleware/HandleInertiaRequests.php  share categories + flash
database/migrations/xxxx_create_entries_table.php
database/factories/EntryFactory.php
lang/id/{validation,auth,passwords,pagination}.php
routes/web.php

resources/js/lib/time.js      dates.js     layout.js     filter.js   (+ *.test.js)
resources/js/Pages/Calendar/Index.jsx
resources/js/Components/Calendar/{TopBar,Sidebar,MiniCalendar,CategoryFilter,TimeGrid,EntryBlock,NowLine,MonthGrid,DayStrip,EntryForm}.jsx
resources/js/Components/Toast.jsx
resources/js/hooks/useMediaQuery.js

tests/Unit/CategoryTest.php  tests/Unit/CalendarRangeTest.php
tests/Feature/HomeRedirectTest.php  tests/Feature/CalendarTest.php  tests/Feature/EntryTest.php
release.sh  server-deploy.sh  README.md
```

---

### Task 1: Scaffold Laravel 12 + Breeze React + Vitest

**Files:**
- Create: seluruh skeleton Laravel, `.nvmrc`, `vitest.config.js`, `tests/Feature/HomeRedirectTest.php`, `resources/js/Pages/Calendar/Index.jsx` (stub)
- Modify: `.env`, `.env.example`, `config/app.php`, `routes/web.php`, `package.json`, `.gitignore`
- Delete: `resources/js/Pages/Welcome.jsx`, `resources/js/Pages/Dashboard.jsx`

**Interfaces:**
- Produces: route `home` (`/`), route `calendar` (`/calendar`, middleware `auth`) yang untuk sekarang merender `Calendar/Index` tanpa props; `npm test` menjalankan Vitest; Breeze `RouteServiceProvider`-less redirect setelah login/register/verify ke `route('calendar')`.

- [ ] **Step 1: Buat project di scratch lalu salin ke repo** (repo sudah berisi `.git` dan `docs/`, jadi `create-project` tidak bisa langsung)

```bash
SCRATCH=/private/tmp/claude-502/-Users-DonDev-Projects-journaling/488a130d-009f-4b1e-86d1-e3908b1554b5/scratchpad
composer create-project laravel/laravel:^12.0 "$SCRATCH/app"
rsync -a --exclude .git "$SCRATCH/app/" /Users/DonDev/Projects/journaling/
cd /Users/DonDev/Projects/journaling
composer require laravel/breeze:^2.3 --dev
php artisan breeze:install react --no-interaction
echo "22.12.0" > .nvmrc
npm install && npm install -D vitest
```

- [ ] **Step 2: Konfigurasi app**

`.env` dan `.env.example`: `APP_NAME=Journaling`, `APP_TIMEZONE=Asia/Jakarta`, `APP_LOCALE=id`, `APP_FALLBACK_LOCALE=en`, `DB_CONNECTION=sqlite`. `config/app.php`: `'timezone' => env('APP_TIMEZONE', 'Asia/Jakarta')`. `package.json` script `"test": "vitest run"`. `vitest.config.js`: `test: { include: ['resources/js/**/*.test.js'], environment: 'node' }` (file terpisah, tanpa plugin laravel).

- [ ] **Step 3: Tulis test redirect yang gagal** di `tests/Feature/HomeRedirectTest.php`

```php
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
```

- [ ] **Step 4: Jalankan, pastikan gagal**

Run: `php artisan test --filter=HomeRedirectTest` → FAIL (route `calendar` belum ada).

- [ ] **Step 5: Implementasi**

`routes/web.php`: `/` → closure redirect ke `calendar` kalau `auth()->check()`, selain itu ke `login`; `Route::get('/calendar', ...)->middleware('auth')->name('calendar')` sementara `Inertia::render('Calendar/Index')`; hapus route `dashboard` dan welcome. Ganti semua `route('dashboard', absolute: false)` di controller auth Breeze menjadi `route('calendar', absolute: false)`, dan referensi `dashboard` di JSX Breeze (`AuthenticatedLayout`, `GuestLayout`) jadi `calendar`. Hapus `Welcome.jsx`, `Dashboard.jsx`. Buat stub `Pages/Calendar/Index.jsx` yang merender `<div>Kalender</div>`. Sesuaikan test Breeze yang memakai `route('dashboard')` → `route('calendar')`.

- [ ] **Step 6: Jalankan semua test**

Run: `php artisan test && npm test -- --passWithNoTests && npm run build`
Expected: semua PHPUnit hijau (Breeze + HomeRedirect), Vitest exit 0, build sukses.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold Laravel 12 + Breeze React + Vitest"
```

---

### Task 2: Enum Category, tabel entries, model Entry, shared props

**Files:**
- Create: `app/Enums/Category.php`, `database/migrations/2026_10_20_000000_create_entries_table.php`, `app/Models/Entry.php`, `database/factories/EntryFactory.php`, `tests/Unit/CategoryTest.php`
- Modify: `app/Models/User.php`, `app/Http/Middleware/HandleInertiaRequests.php`

**Interfaces:**
- Produces:
  - `enum Category: string` dengan case `Work='work'`, `Study='study'`, `Meal='meal'`, `Exercise='exercise'`, `Rest='rest'`, `Social='social'`, `Travel='travel'`, `Personal='personal'`, `Other='other'`; `label(): string`, `color(): string`, `static options(): array<int, array{value:string,label:string,color:string}>` (urutan sesuai case).
  - `Entry` (fillable `date,start_time,end_time,title,note,category`; casts `category => Category::class`, `date => 'date:Y-m-d'`), `Entry::user(): BelongsTo`, `User::entries(): HasMany`.
  - `Entry::toCalendarArray(): array{id:int,date:string,start_time:string,end_time:string,title:string,note:?string,category:string}` dengan jam dipotong ke `HH:MM`.
  - `EntryFactory` default: tanggal hari ini, `09:00`–`10:00`, judul faker, kategori acak.
  - Shared props Inertia: `categories` (= `Category::options()`), `flash.success` (= `session('success')`).

- [ ] **Step 1: Tulis test gagal** di `tests/Unit/CategoryTest.php`

```php
public function test_options_lists_all_nine_categories_in_order(): void
{
    $options = Category::options();
    $this->assertCount(9, $options);
    $this->assertSame(['value' => 'work', 'label' => 'Kerja', 'color' => '#2563EB'], $options[0]);
    $this->assertSame('other', $options[8]['value']);
}
```

Tambah di test yang sama (extend `Tests\TestCase`, `RefreshDatabase`): `test_entry_serializes_times_as_hh_mm` → buat entri `start_time '09:07'`, `end_time '23:59'`, refresh dari DB, `toCalendarArray()['start_time'] === '09:07'` dan `['end_time'] === '23:59'`, `['date'] === '2026-10-20'`, `['category'] === 'work'`.

- [ ] **Step 2: Jalankan, pastikan gagal** — `php artisan test --filter=CategoryTest` → FAIL (class not found).

- [ ] **Step 3: Implementasi** enum (label & warna persis tabel spec §3.2), migration (kolom & index `(user_id, date)` sesuai spec §3.1, `category` string(32), `title` string(120)), model, relasi, factory, shared props.

- [ ] **Step 4: Jalankan** — `php artisan test` → semua PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat: add Category enum, entries table and Entry model"` (sertakan file baru dengan `git add -A`).

---

### Task 3: CalendarRange

**Files:**
- Create: `app/Support/CalendarRange.php`, `tests/Unit/CalendarRangeTest.php`

**Interfaces:**
- Produces: `final class CalendarRange` dengan properti readonly `string $view`, `CarbonImmutable $date`, `CarbonImmutable $start`, `CarbonImmutable $end`; `public static function make(?string $view, ?string $date, CarbonImmutable $today): self`. `view` di luar `day|week|month` → `week`; `date` yang tidak lolos `Y-m-d` ketat (pakai `CarbonImmutable::createFromFormat('!Y-m-d', ...)` dan bandingkan hasil format balik dengan input) → `$today`.

- [ ] **Step 1: Tulis test gagal** (`$today = CarbonImmutable::parse('2026-10-20')`)

```php
// [view, date, expectedView, expectedStart, expectedEnd]
public static function ranges(): array
{
    return [
        'day'                 => ['day',   '2026-10-20', 'day',   '2026-10-20', '2026-10-20'],
        'week mid'            => ['week',  '2026-10-20', 'week',  '2026-10-18', '2026-10-24'],
        'week on sunday'      => ['week',  '2026-10-18', 'week',  '2026-10-18', '2026-10-24'],
        'week across year'    => ['week',  '2026-12-31', 'week',  '2026-12-27', '2027-01-02'],
        'month october'       => ['month', '2026-10-20', 'month', '2026-09-27', '2026-10-31'],
        'month feb 4 weeks'   => ['month', '2026-02-10', 'month', '2026-02-01', '2026-02-28'],
        'bad view'            => ['year',  '2026-10-20', 'week',  '2026-10-18', '2026-10-24'],
        'bad date'            => ['day',   '2026-13-45', 'day',   '2026-10-20', '2026-10-20'],
        'nulls'               => [null,    null,         'week',  '2026-10-18', '2026-10-24'],
    ];
}
```

`#[DataProvider('ranges')] test_make(...)` assert `view`, `start->toDateString()`, `end->toDateString()`.

- [ ] **Step 2: Jalankan, pastikan gagal** — `php artisan test --filter=CalendarRangeTest` → FAIL.
- [ ] **Step 3: Implementasi** pakai `startOfWeek(Carbon::SUNDAY)` / `endOfWeek(Carbon::SATURDAY)`; month = `startOfMonth()->startOfWeek(SUNDAY)` s/d `endOfMonth()->endOfWeek(SATURDAY)`. Semua di-`startOfDay()`.
- [ ] **Step 4: Jalankan** → PASS.
- [ ] **Step 5: Commit** — `"feat: add CalendarRange"`.

---

### Task 4: CalendarController

**Files:**
- Create: `app/Http/Controllers/CalendarController.php`, `tests/Feature/CalendarTest.php`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `CalendarRange::make`, `Entry::toCalendarArray`, `User::entries`.
- Produces: props `Calendar/Index`: `view: string`, `date: 'Y-m-d'`, `range: {start, end}`, `today: 'Y-m-d'` (WIB), `entries: array` (urut `date`, `start_time`).

- [ ] **Step 1: Tulis test gagal** (`RefreshDatabase`, `$this->travelTo(CarbonImmutable::parse('2026-10-20 10:00'))`)

- `test_week_view_returns_only_own_entries_in_range`: user A punya entri 2026-10-18, 2026-10-24, 2026-10-25; user B punya entri 2026-10-20. GET `/calendar?view=week&date=2026-10-20` → `assertInertia`: component `Calendar/Index`, `view` `week`, `range.start` `2026-10-18`, `range.end` `2026-10-24`, `today` `2026-10-20`, `entries` count 2.
- `test_entries_are_sorted_by_date_then_start_time`: dua entri 2026-10-20 jam `14:00` dan `08:30` → `entries.0.start_time` `08:30`.
- `test_month_view_includes_leading_days_from_previous_month`: entri 2026-09-27 ikut di `view=month&date=2026-10-05`.
- `test_invalid_query_falls_back_to_week_and_today`: `?view=agenda&date=kemarin` → status 200, `view` `week`, `date` `2026-10-20`.
- `test_default_without_query_is_week_today`.

- [ ] **Step 2: Jalankan, pastikan gagal** — `php artisan test --filter=CalendarTest`.
- [ ] **Step 3: Implementasi** `CalendarController::show(Request $request): Response`, `today` dari `CarbonImmutable::today()` (timezone app). Ganti closure route `calendar` dengan controller ini.
- [ ] **Step 4: Jalankan** — `php artisan test` → PASS.
- [ ] **Step 5: Commit** — `"feat: calendar endpoint with range-scoped entries"`.

---

### Task 5: CRUD entri + validasi + bahasa Indonesia

**Files:**
- Create: `app/Http/Controllers/EntryController.php`, `app/Http/Requests/EntryRequest.php`, `app/Policies/EntryPolicy.php`, `lang/id/validation.php`, `lang/id/auth.php`, `lang/id/passwords.php`, `lang/id/pagination.php`, `tests/Feature/EntryTest.php`
- Modify: `routes/web.php`

**Interfaces:**
- Produces: route `entries.store` (POST `/entries`), `entries.update` (PUT `/entries/{entry}`), `entries.destroy` (DELETE `/entries/{entry}`), semua `auth`. Sukses → `back()` + flash `success`: `"Entri disimpan."` (store/update), `"Entri dihapus."` (destroy). Payload: `title, date, start_time, end_time, category, note`.

- [ ] **Step 1: Tulis test gagal** (payload valid dasar: `title 'Sarapan'`, `date '2026-10-20'`, `start_time '07:05'`, `end_time '07:40'`, `category 'meal'`, `note null`)

- `test_user_can_create_entry` → redirect, `assertSessionHas('success', 'Entri disimpan.')`, `assertDatabaseHas('entries', ['user_id' => $user->id, 'title' => 'Sarapan', 'category' => 'meal'])`.
- `test_user_can_update_own_entry`, `test_user_can_delete_own_entry` (`assertModelMissing`).
- `test_cannot_update_or_delete_other_users_entry` → PUT dan DELETE ke entri user lain `assertNotFound()`, data tidak berubah.
- `test_guest_cannot_create_entry` → redirect login.
- Data provider `invalidPayloads` → `assertSessionHasErrors($field)`:

```php
'title kosong'        => [['title' => ''], 'title'],
'title 121'           => [['title' => str_repeat('a', 121)], 'title'],
'tanggal salah'       => [['date' => '20-10-2026'], 'date'],
'jam tanpa nol'       => [['start_time' => '9:5'], 'start_time'],
'jam 24:00'           => [['end_time' => '24:00'], 'end_time'],
'selesai = mulai'     => [['start_time' => '10:00', 'end_time' => '10:00'], 'end_time'],
'selesai < mulai'     => [['start_time' => '10:00', 'end_time' => '09:59'], 'end_time'],
'kategori asing'      => [['category' => 'gaming'], 'category'],
'note terlalu panjang'=> [['note' => str_repeat('a', 10001)], 'note'],
```

- `test_end_time_2359_is_accepted`: `start_time '23:00'`, `end_time '23:59'` → no errors.
- `test_validation_messages_are_indonesian`: title kosong → error `title` berisi `"Judul wajib diisi."`.

- [ ] **Step 2: Jalankan, pastikan gagal** — `php artisan test --filter=EntryTest`.
- [ ] **Step 3: Implementasi**
  - `EntryRequest::rules()` persis spec §4.4. `attributes()`: `title→judul, date→tanggal, start_time→jam mulai, end_time→jam selesai, category→kategori, note→catatan`.
  - `lang/id/validation.php`: pesan untuk `required` (`:Attribute wajib diisi.`), `string`, `max.string`, `min.string`, `date_format`, `after` (`:Attribute harus setelah :date.`; Laravel mengganti `:date` dengan nama atribut `start_time` dari `attributes()`, jadi hasilnya "Jam selesai harus setelah jam mulai."), `enum`, `email`, `confirmed`, `unique`, `lowercase`, `current_password`; `attributes`: `name→nama, email→email, password→kata sandi`. File `auth.php`/`passwords.php`/`pagination.php` terjemahan Indonesia dari versi `en` (`php artisan lang:publish` dulu untuk referensi kunci, lalu hapus folder `lang/en` agar tidak ikut ter-commit kalau tidak diubah).
  - Binding di `routes/web.php`: `Route::bind('entry', fn (string $value) => request()->user()->entries()->findOrFail($value));`
  - `EntryPolicy::update/delete(User, Entry): bool` → `$entry->user_id === $user->id`; controller memanggil `Gate::authorize`.
- [ ] **Step 4: Jalankan** — `php artisan test` → PASS (termasuk test Breeze; kalau ada test Breeze yang mencocokkan pesan bahasa Inggris, sesuaikan ke pesan Indonesia).
- [ ] **Step 5: Commit** — `"feat: entry CRUD with ownership-scoped binding and Indonesian validation"`.

---

### Task 6: `lib/time.js` dan `lib/dates.js`

**Files:**
- Create: `resources/js/lib/time.js`, `resources/js/lib/time.test.js`, `resources/js/lib/dates.js`, `resources/js/lib/dates.test.js`

**Interfaces (semua tanggal string `YYYY-MM-DD`, hitungan internal pakai `Date.UTC` agar bebas timezone browser):**
- `time.js`
  - `toMinutes(hhmm: string): number`
  - `fromMinutes(min: number): string` → `'HH:MM'`, di-clamp `0..1439`
  - `snap(min: number, step = 15, mode: 'nearest'|'floor' = 'nearest'): number`
  - `addMinutes(hhmm: string, delta: number): string` (clamp ke `23:59`)
  - `nowInJakarta(now: Date = new Date()): { date: string, time: string, minutes: number }` via `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', ... })`
- `dates.js`
  - `addDays(iso: string, n: number): string`
  - `dayOfWeek(iso: string): number` (0 = Minggu)
  - `rangeFor(view: 'day'|'week'|'month', iso: string): { start: string, end: string }` (aturan sama dengan `CalendarRange`)
  - `eachDay(start: string, end: string): string[]`
  - `shift(view, iso: string, dir: -1|1): string` (day ±1, week ±7, month: bulan ±1 dengan tanggal di-clamp ke akhir bulan)
  - `isoWeek(iso: string): number` (dihitung dari Senin = `addDays(start minggu, 1)`)
  - `formatTitle(view, iso): string`
  - `formatDayLong(iso): string` → `'Selasa, 20 Oktober 2026'`
  - konstanta `DAY_SHORT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']`, `MONTHS = ['Januari', …, 'Desember']`

- [ ] **Step 1: Tulis test gagal**

```js
// time.test.js
expect(toMinutes('09:07')).toBe(547);
expect(fromMinutes(547)).toBe('09:07');
expect(fromMinutes(1500)).toBe('23:59');
expect(snap(547)).toBe(540);            // 09:07 → 09:00
expect(snap(553)).toBe(555);            // 09:13 → 09:15
expect(snap(553, 15, 'floor')).toBe(540);
expect(addMinutes('23:45', 30)).toBe('23:59');
// 2026-10-20 23:30 UTC = 2026-10-21 06:30 WIB
expect(nowInJakarta(new Date(Date.UTC(2026, 9, 20, 23, 30)))).toEqual({ date: '2026-10-21', time: '06:30', minutes: 390 });

// dates.test.js
expect(rangeFor('week', '2026-10-20')).toEqual({ start: '2026-10-18', end: '2026-10-24' });
expect(rangeFor('week', '2026-12-31')).toEqual({ start: '2026-12-27', end: '2027-01-02' });
expect(rangeFor('month', '2026-10-20')).toEqual({ start: '2026-09-27', end: '2026-10-31' });
expect(rangeFor('month', '2026-02-10')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
expect(eachDay('2026-10-18', '2026-10-24')).toHaveLength(7);
expect(shift('day', '2026-12-31', 1)).toBe('2027-01-01');
expect(shift('week', '2026-10-20', -1)).toBe('2026-10-13');
expect(shift('month', '2026-01-31', 1)).toBe('2026-02-28');
expect(isoWeek('2026-10-20')).toBe(43);
expect(isoWeek('2026-12-31')).toBe(53);
expect(formatTitle('week', '2026-10-20')).toBe('Minggu 43, Oktober 2026');
expect(formatTitle('week', '2026-10-01')).toBe('Minggu 40, September 2026');
expect(formatTitle('month', '2026-10-20')).toBe('Oktober 2026');
expect(formatTitle('day', '2026-10-20')).toBe('Selasa, 20 Oktober 2026');
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `npm test` → FAIL.
- [ ] **Step 3: Implementasi** kedua file.
- [ ] **Step 4: Jalankan** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `"feat: pure date/time helpers"`.

---

### Task 7: `lib/layout.js` dan `lib/filter.js`

**Files:**
- Create: `resources/js/lib/layout.js`, `layout.test.js`, `resources/js/lib/filter.js`, `filter.test.js`

**Interfaces:**
- Consumes: `toMinutes` dari `time.js`.
- `layout.js`
  - `HOUR_HEIGHT = 64`, `MIN_BLOCK_HEIGHT = 20`
  - `blockGeometry(entry): { top: number, height: number }` (px; `top = start/60*64`, `height = max((end-start)/60*64, 20)`)
  - `layoutDay(entries): Array<{ entry, top, height, column, columns }>` untuk entri satu hari. Dua entri bentrok kalau `a.start < b.end && b.start < a.end` (batas bersentuhan tidak bentrok).
- `filter.js`
  - `STORAGE_KEY = 'journaling.categories'`
  - `matchesFilter(entry, { categories: string[], query: string }): boolean` (kategori harus ada di `categories`; `query` di-trim, case-insensitive, cocok ke `title` atau `note`; `note` null aman)
  - `parseStoredCategories(raw: string|null, allValues: string[]): string[]` (JSON array; buang nilai tak dikenal; raw null/rusak/bukan array → `allValues`)

Algoritma `layoutDay` (tidak ditentukan oleh signature):

```
urutkan by start asc, lalu end desc
cluster = []; clusterEnd = -1
untuk tiap entri e:
  kalau e.start >= clusterEnd: tutup cluster (set columns = jumlah kolom cluster), mulai cluster baru
  cari kolom terkecil yang end-terakhirnya <= e.start, kalau tidak ada buat kolom baru
  clusterEnd = max(clusterEnd, e.end)
tutup cluster terakhir
```

- [ ] **Step 1: Tulis test gagal**

```js
const e = (id, s, t) => ({ id, start_time: s, end_time: t });
expect(blockGeometry(e(1, '09:00', '10:30'))).toEqual({ top: 576, height: 96 });
expect(blockGeometry(e(1, '09:00', '09:01')).height).toBe(20);
expect(blockGeometry(e(1, '23:00', '23:59'))).toEqual({ top: 1472, height: 62.93333333333333 }); // pakai toBeCloseTo
// tanpa bentrok
expect(layoutDay([e(1,'09:00','10:00'), e(2,'10:00','11:00')]).map(r => [r.column, r.columns])).toEqual([[0,1],[0,1]]);
// dua bentrok
expect(layoutDay([e(1,'09:00','10:00'), e(2,'09:30','10:30')]).map(r => [r.column, r.columns])).toEqual([[0,2],[1,2]]);
// rantai A-B-C
expect(layoutDay([e('A','09:00','10:00'), e('B','09:30','10:30'), e('C','10:00','11:00')]).map(r => [r.entry.id, r.column, r.columns]))
  .toEqual([['A',0,2],['B',1,2],['C',0,2]]);

const entry = { title: 'Rapat tim', note: null, category: 'work' };
expect(matchesFilter(entry, { categories: ['work'], query: '' })).toBe(true);
expect(matchesFilter(entry, { categories: ['meal'], query: '' })).toBe(false);
expect(matchesFilter(entry, { categories: ['work'], query: '  RAPAT ' })).toBe(true);
expect(matchesFilter(entry, { categories: ['work'], query: 'kopi' })).toBe(false);
expect(matchesFilter({ ...entry, note: 'minum kopi' }, { categories: ['work'], query: 'kopi' })).toBe(true);
const all = ['work', 'meal'];
expect(parseStoredCategories(null, all)).toEqual(all);
expect(parseStoredCategories('{rusak', all)).toEqual(all);
expect(parseStoredCategories('["meal","gaming"]', all)).toEqual(['meal']);
expect(parseStoredCategories('[]', all)).toEqual([]);
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `npm test`.
- [ ] **Step 3: Implementasi**.
- [ ] **Step 4: Jalankan** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `"feat: block layout and filter helpers"`.

---

### Task 8: Shell halaman kalender (TopBar, Sidebar, MiniCalendar, filter, navigasi)

**Files:**
- Create: `Pages/Calendar/Index.jsx` (ganti stub), `Components/Calendar/TopBar.jsx`, `Sidebar.jsx`, `MiniCalendar.jsx`, `CategoryFilter.jsx`, `Components/Toast.jsx`, `hooks/useMediaQuery.js`
- Modify: `tailwind.config.js` (warna aksen), `resources/views/app.blade.php` (`lang="id"`, viewport sudah ada)

**Interfaces:**
- Consumes: props Task 4, shared `categories` & `flash`, `dates.js`, `filter.js`.
- Produces untuk task berikutnya (state di `Index.jsx`, diteruskan sebagai props):
  - `visibleEntries` (sudah difilter `matchesFilter`)
  - `navigate({ view?, date? })` → `router.get(route('calendar'), { view, date }, { preserveState: true, preserveScroll: true, only: ['view','date','range','today','entries'] })`
  - `openForm(initial)` di mana `initial = { id?, date, start_time, end_time, title?, note?, category? }`; `null` = tutup. (Form dirender di Task 11; untuk sekarang state saja.)
  - `useMediaQuery(query: string): boolean`
- `TopBar` props: `view, date, onNavigate, onToday, onMenu, isMobile, user`. Menu user (Profile, Logout) pakai `Dropdown` Breeze.
- `MiniCalendar` props: `selected: string, today: string, onSelect(iso)`; punya state bulan tampilan sendiri, panah « ‹ › » (tahun/bulan).
- `CategoryFilter` props: `categories, enabled: string[], onChange(enabled)`.

- [ ] **Step 1: Implementasi** layout desktop per spec §5.2 (TopBar + Sidebar 280px + area konten berisi placeholder daftar `visibleEntries`). State filter dibaca dengan `parseStoredCategories` dan disimpan ke `localStorage[STORAGE_KEY]` dalam try/catch. `Toast` membaca `flash.success`, hilang setelah 3 detik.
- [ ] **Step 2: Verifikasi** — `npm run build` sukses; `php artisan test` tetap hijau; buka `composer run dev`, login, pastikan prev/next/Today/Day-Week-Month mengubah URL & judul (`Minggu 43, Oktober 2026`), klik tanggal di mini calendar pindah tanggal, uncheck kategori bertahan setelah reload.
- [ ] **Step 3: Commit** — `"feat: calendar shell with navigation, mini calendar and filters"`.

---

### Task 9: TimeGrid untuk Day & Week view

**Files:**
- Create: `Components/Calendar/TimeGrid.jsx`, `EntryBlock.jsx`, `NowLine.jsx`
- Modify: `Pages/Calendar/Index.jsx`

**Interfaces:**
- Consumes: `layoutDay`, `HOUR_HEIGHT`, `eachDay`, `DAY_SHORT`, `nowInJakarta`, `snap`, `addMinutes`, `fromMinutes`.
- `TimeGrid` props: `days: string[]` (1 atau 7), `entries`, `today`, `categories`, `onSlotClick({ date, start_time, end_time })`, `onEntryClick(entry)`, `onSwipe?(dir: -1|1)`.
- `EntryBlock` props: `entry, top, height, column, columns, color, onClick`.

- [ ] **Step 1: Implementasi** per spec §5.2: kolom label jam `00:00`–`23:00`, 24 baris × 64px, header hari (Minggu merah, hari ini lingkaran aksen), auto-scroll saat mount/ganti tanggal (`max(jam sekarang − 1, 0)` kalau hari ini dalam `days`, selain itu jam 07:00). Klik area kosong kolom: hitung menit dari `offsetY / HOUR_HEIGHT * 60`, `snap` 15 menit, selesai `addMinutes(+30)`. `EntryBlock`: border kiri 4px warna kategori, latar warna kategori ~12% opacity (`color + '1F'`), jam mulai + judul truncate, blok < 30 menit satu baris. `NowLine` hanya di kolom `nowInJakarta().date`, update tiap 60 detik. Swipe: `pointerdown/up` dengan |dx| > 60 dan |dx| > |dy|.
- [ ] **Step 2: Verifikasi** — seed manual beberapa entri via tinker (termasuk bentrok A-B-C dan entri 1 menit), cek tampilan Week & Day di 1440px; `npm run build` sukses.
- [ ] **Step 3: Commit** — `"feat: day and week time grid"`.

---

### Task 10: MonthGrid

**Files:**
- Create: `Components/Calendar/MonthGrid.jsx`
- Modify: `Pages/Calendar/Index.jsx`

**Interfaces:**
- `MonthGrid` props: `range, date, today, entries, categories, onDayOpen(iso)` (→ `navigate({ view: 'day', date: iso })`), `onCellCreate(iso)` (→ `openForm({ date: iso, start_time: '09:00', end_time: '09:30' })`), `onEntryClick(entry)`.

- [ ] **Step 1: Implementasi** per spec §5.2: header `DAY_SHORT`, sel per hari di `eachDay(range.start, range.end)`, tanggal luar bulan dipudarkan, maksimal 3 entri (titik warna + `HH:MM` + judul) lalu `+N lagi`. Di mobile, entri jadi titik warna saja agar muat.
- [ ] **Step 2: Verifikasi** — Oktober 2026 tampil 5 baris mulai 27 Sep, Februari 2026 tampil 4 baris; `npm run build` sukses.
- [ ] **Step 3: Commit** — `"feat: month grid"`.

---

### Task 11: EntryForm (buat, edit, hapus)

**Files:**
- Create: `Components/Calendar/EntryForm.jsx`
- Modify: `Pages/Calendar/Index.jsx`

**Interfaces:**
- Consumes: `openForm` state, routes `entries.store/update/destroy`, `nowInJakarta`, `categories`.
- `EntryForm` props: `initial | null, categories, isMobile, onClose`.

- [ ] **Step 1: Implementasi** per spec §5.5: `useForm({ title, date, start_time, end_time, category: 'work', note: '' })` diisi dari `initial`. Field sesuai spec, `type=time step=60`, tombol "Sekarang" mengisi `nowInJakarta().time`. Kategori = chip berwarna (radio). Submit `post(route('entries.store'))` atau `put(route('entries.update', id))` dengan `{ preserveScroll: true, preserveState: true, onSuccess: onClose }`; tombol Simpan `disabled={processing}` (cegah dobel tap). Mode edit: tombol Hapus → panel konfirmasi inline "Hapus entri ini?" Batal/Hapus → `delete(...)`. Desktop modal (pakai `Modal` Breeze), mobile bottom sheet `fixed inset-0` dengan footer tombol menempel bawah. Error per field pakai `InputError`. Sambungkan: klik slot, klik blok, sel bulan.
- [ ] **Step 2: Verifikasi** di browser: buat entri dari slot (jam ter-snap), edit judul, hapus via konfirmasi, coba `end_time` < `start_time` → pesan "Jam selesai harus setelah jam mulai." muncul, toast "Entri disimpan." muncul lalu hilang. `php artisan test && npm test && npm run build` hijau.
- [ ] **Step 3: Commit** — `"feat: entry form for create, edit and delete"`.

---

### Task 12: Mobile & tablet

**Files:**
- Create: `Components/Calendar/DayStrip.jsx`
- Modify: `Pages/Calendar/Index.jsx`, `TopBar.jsx`, `Sidebar.jsx`

**Interfaces:**
- `DayStrip` props: `date, today, onSelect(iso), onShiftWeek(dir)`.

- [ ] **Step 1: Implementasi** per spec §5.3–5.4:
  - `isMobile = useMediaQuery('(max-width: 767px)')`, `isCompact = useMediaQuery('(max-width: 1023px)')`.
  - Mount: kalau `isMobile` dan URL tidak punya `view` → `router.get(..., { view: 'day', date }, { replace: true, ... })`. Kalau `isMobile` dan `view === 'week'` → render sebagai Day view + DayStrip.
  - Segmented control mobile cuma Day / Month.
  - `isCompact`: Sidebar jadi drawer kiri (overlay, tutup saat tap luar / pilih tanggal), dibuka dari tombol ⋮.
  - FAB `+` (mobile): `openForm` dengan tanggal yang dilihat, jam = `fromMinutes(snap(nowInJakarta().minutes, 15, 'floor'))` kalau tanggal = hari ini, selain itu `09:00`; selesai +30 menit.
  - Swipe di TimeGrid Day view → `navigate({ date: shift('day', date, dir) })`.
  - Semua target sentuh ≥ 44px.
- [ ] **Step 2: Verifikasi** di browser ukuran 390×844 dan 820×1180: default buka Day, DayStrip geser minggu, drawer buka/tutup, FAB membuka bottom sheet dengan jam sekarang, swipe pindah hari, tidak ada scroll horizontal halaman.
- [ ] **Step 3: Commit** — `"feat: mobile day strip, drawer, FAB and swipe"`.

---

### Task 13: Halaman Breeze berbahasa Indonesia

**Files:**
- Modify: `Pages/Auth/*.jsx`, `Pages/Profile/**/*.jsx`, `Layouts/AuthenticatedLayout.jsx`, `Layouts/GuestLayout.jsx`, `Components/ApplicationLogo.jsx`

- [ ] **Step 1: Implementasi** — terjemahkan semua teks (Login → "Masuk", Register → "Daftar", "Lupa kata sandi?", dst.), tautan nav "Kalender" ke `route('calendar')`, logo sederhana (ikon buku/kalender + "Journaling"), warna tombol pakai aksen yang sama dengan kalender. Halaman auth enak di 390px.
- [ ] **Step 2: Verifikasi** — `php artisan test` hijau (perbarui assertion teks kalau ada); alur register → masuk kalender → profile → logout jalan di browser.
- [ ] **Step 3: Commit** — `"feat: Indonesian auth and profile pages"`.

---

### Task 14: Script deploy, README, verifikasi akhir

**Files:**
- Create: `release.sh`, `server-deploy.sh`, `README.md`
- Modify: `.gitignore` (pastikan `public/build` di-ignore di `main`)

- [ ] **Step 1: Implementasi** — salin pola `/Users/DonDev/Projects/celengin/release.sh` dan `server-deploy.sh`: hapus langkah `npx tsc --noEmit`, ganti dengan `npm test`; sisanya (cek working tree bersih, cek Node ≥ 22.12, `php artisan test`, build, merge `main` → `deploy` dengan `public/build` di-force add, push) sama. `server-deploy.sh` tanpa bagian service worker. README: cara jalan lokal (`composer install`, `npm install`, `cp .env.example .env`, `php artisan key:generate`, `php artisan migrate`, `composer run dev`), cara test, cara rilis, `.env` produksi (`APP_TIMEZONE=Asia/Jakarta`, `APP_LOCALE=id`, MySQL).
- [ ] **Step 2: Verifikasi akhir** — `php artisan test && npm test && npm run build` semua hijau; jalankan migrasi di MySQL lokal sekali (`DB_CONNECTION=mysql` sementara) untuk memastikan migration kompatibel; di browser 1440px dan 390px jalankan skenario spec §7 (register → buat entri lewat slot, tombol +, month view → edit → hapus → ganti view → filter kategori).
- [ ] **Step 3: Commit** — `"chore: add release scripts and README"`.
