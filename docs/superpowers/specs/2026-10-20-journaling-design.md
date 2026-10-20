# Journaling App: Design Spec

Tanggal: 2026-10-20
Status: disetujui di sesi brainstorming, menunggu review spec tertulis

## 1. Tujuan

Web app journaling multi-user. Tiap user login lalu mencatat aktivitas hariannya sebagai blok waktu (presisi menit) lengkap dengan catatan bebas. Gabungan time tracking dan diary: user bisa lihat waktunya habis ke mana sekaligus menulis cerita tiap aktivitas. Tampilan utama berupa kalender Day / Week / Month seperti Bryntum Calendar, dan harus enak dipakai di HP.

**Kriteria sukses**
- User baru bisa register, login, dan mencatat entri pertama dalam kurang dari 1 menit, di desktop maupun HP.
- Entri tampil di posisi jam yang tepat di Day/Week view, entri bentrok tidak saling menutupi.
- User tidak pernah bisa melihat atau mengubah entri user lain.

**Di luar scope v1 (YAGNI)**
- Entri all-day atau multi-hari, entri yang melewati tengah malam
- Laporan / statistik / total jam per kategori
- Kategori buatan user (daftar kategori tetap)
- Drag & resize blok di kalender
- Year view, Agenda view
- Rich text di catatan, lampiran foto, mood tracker
- Timezone per user

## 2. Stack

Mirror `/Projects/kji`:
- Laravel 12, PHP ^8.2
- Laravel Breeze (React stack, JSX) untuk register / login / reset password / profile
- Inertia v2 + React 18 JSX + Ziggy
- Tailwind CSS + `@tailwindcss/forms`, Vite 7
- MySQL di produksi (cPanel), sqlite untuk test & dev lokal
- PHPUnit untuk feature test, Vitest untuk fungsi murni di `resources/js/lib/`
- Repo git sendiri di `/Projects/journaling`
- Node ≥ 22.12 (`.nvmrc`), alasan sama seperti celengin (Vite 7)

Timezone app dikunci `Asia/Jakarta`. Locale UI Indonesia, format jam 24 jam.

## 3. Data

### 3.1 Tabel `entries`

| kolom | tipe | aturan |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | FK `users.id`, `cascadeOnDelete` | pemilik |
| `date` | DATE | hari entri |
| `start_time` | TIME | `HH:MM`, detik selalu `00` |
| `end_time` | TIME | `HH:MM`, wajib > `start_time`, maksimal `23:59` |
| `title` | string(120) | wajib |
| `note` | TEXT nullable | teks biasa, line break dipertahankan, maks 10.000 karakter |
| `category` | string(32) | nilai enum `Category` |
| `created_at`, `updated_at` | timestamps | |

Index: `(user_id, date)`.

Model `Entry`: `belongsTo(User)`, cast `category` ke enum `Category`, cast `date` ke `date:Y-m-d`. `User` `hasMany(Entry)`.

Entri bentrok jam diperbolehkan.

### 3.2 Enum `App\Enums\Category`

Backed string enum, satu-satunya sumber daftar kategori. Tiap case punya `label()` dan `color()` (hex).

| value | label | warna |
|---|---|---|
| `work` | Kerja | `#2563EB` |
| `study` | Belajar | `#7C3AED` |
| `meal` | Makan | `#F59E0B` |
| `exercise` | Olahraga | `#16A34A` |
| `rest` | Istirahat | `#0891B2` |
| `social` | Sosial | `#C026D3` |
| `travel` | Perjalanan | `#EA580C` |
| `personal` | Pribadi | `#E11D48` |
| `other` | Lainnya | `#64748B` |

Warna final boleh disesuaikan saat implementasi asal kontras teks tetap terbaca. Daftar dikirim ke frontend lewat `HandleInertiaRequests::share()` sebagai `categories: [{value, label, color}]`.

## 4. Backend

### 4.1 Route

| method | path | nama | keterangan |
|---|---|---|---|
| GET | `/` | `home` | login → redirect `calendar`, guest → redirect `login` |
| GET | `/calendar` | `calendar` | query `view` (`day`/`week`/`month`), `date` (`Y-m-d`) |
| POST | `/entries` | `entries.store` | |
| PUT | `/entries/{entry}` | `entries.update` | |
| DELETE | `/entries/{entry}` | `entries.destroy` | |

Semua kecuali `/` di bawah middleware `auth`. Route profile bawaan Breeze tetap. Route `dashboard` bawaan Breeze diganti `calendar` (redirect setelah login ke `calendar`).

### 4.2 `CalendarController@show`

1. Normalisasi input: `view` di luar `day|week|month` → `week`. `date` tidak valid → hari ini (WIB). Tidak pernah error 422/500 karena query string.
2. Hitung rentang lewat service murni `App\Support\CalendarRange::for(view, date)`:
   - `day`: tanggal itu saja
   - `week`: Minggu sampai Sabtu yang memuat tanggal itu
   - `month`: Minggu sebelum/tepat tanggal 1 sampai Sabtu setelah/tepat hari terakhir bulan (grid penuh, 5 atau 6 minggu)
3. Ambil entri milik `auth()->user()` dengan `date` di rentang, urut `date, start_time`.
4. Render `Calendar/Index` dengan props: `view`, `date`, `range: {start, end}`, `today`, `entries: [{id, date, start_time, end_time, title, note, category}]` (jam sudah `HH:MM`).

### 4.3 `EntryController`

- `store(EntryRequest)`: buat entri untuk user login, redirect back + flash `success`.
- `update(EntryRequest, Entry)`: authorize lewat policy, update, redirect back + flash.
- `destroy(Entry)`: authorize, hapus, redirect back + flash.

Route model binding di-scope ke user: entri milik user lain menghasilkan **404**, bukan 403, supaya tidak bocor bahwa entri itu ada. Implementasi: binding manual `Route::bind('entry', ...)` yang query `auth()->user()->entries()->findOrFail($id)`, ditambah `EntryPolicy` sebagai lapis kedua.

### 4.4 `EntryRequest` validasi

- `title`: required, string, max:120
- `date`: required, `date_format:Y-m-d`
- `start_time`: required, `date_format:H:i`
- `end_time`: required, `date_format:H:i`, `after:start_time`
- `category`: required, `Rule::enum(Category::class)`
- `note`: nullable, string, max:10000

Pesan error Bahasa Indonesia (file `lang/id/validation.php` minimal untuk aturan di atas, atau `messages()` di request). `APP_LOCALE=id`.

## 5. Frontend

### 5.1 Struktur

```
resources/js/
  Pages/Calendar/Index.jsx        state view/date/filter, rakit layout
  Components/Calendar/
    TopBar.jsx                    Today, ‹ ›, judul, segmented Day/Week/Month
    Sidebar.jsx                   MiniCalendar + CategoryFilter + search
    MiniCalendar.jsx
    CategoryFilter.jsx
    TimeGrid.jsx                  dipakai Day & Week view (1 atau 7 kolom)
    EntryBlock.jsx
    NowLine.jsx
    MonthGrid.jsx
    DayStrip.jsx                  strip 7 hari untuk mobile
    EntryForm.jsx                 modal (desktop) / bottom sheet (mobile)
  lib/
    dates.js                      rentang view, navigasi prev/next, format Indonesia
    layout.js                     posisi blok + susun kolom entri bentrok
    time.js                       parse/format HH:MM, menit dari tengah malam, snap 15 menit
```

Komponen tidak menghitung posisi atau tanggal sendiri, semua lewat `lib/`. Fungsi di `lib/` murni (input → output, tanpa React/DOM) dan dites Vitest.

### 5.2 Layout desktop (≥ 1024px)

- **TopBar**: tombol Today, panah prev/next, judul (Day: "Selasa, 20 Oktober 2026"; Week: "Minggu 43, Oktober 2026", nomor minggu = minggu ISO 8601 dari hari Senin di minggu itu, nama bulan dari hari Minggu pertama; Month: "Oktober 2026"), segmented control Day / Week / Month.
- **Sidebar kiri** (lebar ±280px): MiniCalendar (klik tanggal = pindah ke tanggal itu, view tetap), CategoryFilter (checkbox berwarna per kategori), input "Filter entri" (cocokkan judul/catatan, case-insensitive). Filter client-side. Pilihan checkbox disimpan di `localStorage` (dibungkus try/catch).
- **TimeGrid**: 24 baris jam, tinggi 64px per jam. Saat mount, scroll ke `max(jam sekarang − 1, 0)` kalau hari ini ada di rentang, selain itu ke jam 07:00. Header kolom: nama hari + tanggal, hari ini diberi lingkaran aksen. Minggu ditandai merah seperti contoh.
- **EntryBlock**: `top = start_minute / 60 * 64`, `height = max(durasi_menit / 60 * 64, 20)`. Border kiri 4px warna kategori, latar warna kategori opacity rendah, teks: jam mulai kecil + judul (truncate). Blok pendek (< 30 menit) satu baris saja.
- **Entri bentrok**: `layout.js` mengelompokkan entri yang saling tumpang tindih jadi cluster, tiap entri dapat `column` dan `columns` (jumlah kolom cluster), lalu `left = column / columns`, `width = 1 / columns`.
- **NowLine**: garis merah di kolom hari ini, posisi diperbarui tiap menit.
- **MonthGrid**: grid 7 kolom, tanggal di luar bulan dipudarkan. Tiap sel tampil maks 3 entri (titik warna + jam + judul), sisanya "+N lagi". Klik "+N lagi" atau angka tanggal → Day view tanggal itu. Klik area kosong sel → form entri baru di tanggal itu jam 09:00.

### 5.3 Mobile (< 768px)

- Default view `day` kalau URL tidak menyebut `view` (ditentukan di client lewat `useMediaQuery`, lalu `router.get` dengan `replace: true`).
- Segmented control cuma Day / Month. Di Day view, **DayStrip** (7 hari minggu itu, bisa geser ke minggu sebelum/sesudah) muncul di bawah TopBar sebagai pengganti Week view.
- Sidebar jadi drawer kiri, dibuka dari tombol menu (⋮).
- Floating action button **+** kanan bawah: form entri baru dengan tanggal yang sedang dilihat dan jam mulai = sekarang dibulatkan ke bawah ke 15 menit (atau 09:00 kalau bukan hari ini).
- Swipe horizontal di TimeGrid (jarak > 60px, dominan horizontal) = prev/next hari.
- Target sentuh minimal 44px.

### 5.4 Tablet (768–1023px)

Week view tetap tersedia, sidebar jadi drawer seperti mobile.

### 5.5 EntryForm

- Dibuka dari: klik slot kosong TimeGrid (jam mulai = slot di-snap ke 15 menit terdekat, selesai = mulai + 30 menit, dipotong di 23:59), tombol +, klik sel MonthGrid, atau klik EntryBlock (mode edit).
- Desktop: modal tengah. Mobile: bottom sheet tinggi penuh dengan tombol Simpan tetap terlihat.
- Field: Judul, Tanggal (`type=date`), Jam mulai & Jam selesai (`type=time`, `step=60`), Kategori (chip berwarna, satu pilihan, default `work` untuk entri baru), Catatan (textarea auto-grow).
- Tombol "Sekarang" di samping jam mulai dan jam selesai: isi jam saat ini (WIB, presisi menit).
- Mode edit: tombol Hapus → konfirmasi di dalam modal ("Hapus entri ini?" Batal / Hapus). Tidak memakai `window.confirm`.
- Submit lewat `useForm` Inertia (`post` / `put` / `delete`) dengan `preserveScroll: true`, `preserveState: true`. Error server tampil di bawah field. Sukses → modal tutup, toast flash muncul ±3 detik.

### 5.6 Navigasi & state

- View dan tanggal hidup di URL (`?view=&date=`), jadi bisa di-bookmark dan tombol back browser jalan.
- Prev/next/Today/ganti view/klik mini calendar → `router.get(route('calendar'), {view, date}, {preserveState: true, preserveScroll: true, only: [...]})`.
- Filter kategori & teks tidak masuk URL.

### 5.7 Halaman lain

Halaman auth & profile bawaan Breeze, diterjemahkan ke Bahasa Indonesia dan diselaraskan warnanya. Welcome page Breeze dihapus.

## 6. Error handling

| kasus | perilaku |
|---|---|
| validasi gagal | 422 Inertia, pesan Indonesia di bawah field, form tetap terbuka |
| entri milik user lain / tidak ada | 404 |
| `view`/`date` query tidak valid | fallback ke `week` / hari ini |
| guest buka `/calendar` | redirect ke login |
| `localStorage` tidak tersedia | filter default semua kategori aktif, tidak error |

## 7. Testing

**PHPUnit feature test**
- Breeze bawaan (disesuaikan redirect ke `calendar`)
- `/` redirect sesuai status login
- `CalendarController`: rentang day/week/month benar (termasuk pergantian bulan & tahun), entri di luar rentang tidak ikut, entri user lain tidak ikut, fallback query tidak valid
- `EntryController`: store/update/destroy sukses, validasi (judul kosong, judul > 120, format jam salah, `end_time` ≤ `start_time`, kategori asing), akses entri user lain → 404 untuk update & destroy
- Unit test `CalendarRange`

**Vitest**
- `layout.js`: tanpa bentrok, dua entri bentrok, rantai A-B-C dengan A & C tidak bentrok langsung, entri yang bersentuhan di batas (selesai 10:00 & mulai 10:00 tidak dianggap bentrok)
- `dates.js`: rentang minggu/bulan, prev/next tiap view, nomor minggu, format Indonesia
- `time.js`: parse/format, snap 15 menit, potong di 23:59

**Verifikasi manual di browser**: desktop 1440px dan HP 390px. Register → buat entri lewat slot, tombol +, dan month view → edit → hapus → ganti view → filter kategori.

## 8. Deploy

Pola celengin:
- `release.sh` di lokal: cek working tree bersih, cek versi node, jalankan test, build aset, merge `main` ke branch `deploy` berisi `public/build`, push.
- `server-deploy.sh` di cPanel: pull branch `deploy`, `composer install --no-dev`, `php artisan migrate --force`, cache config/route/view.
- `.env` produksi: `APP_TIMEZONE=Asia/Jakarta`, `APP_LOCALE=id`, MySQL.
- Subdomain ditentukan Don saat deploy. Deploy aktual di luar scope implementasi awal, script disiapkan.
