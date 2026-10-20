<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @php
            $siteUrl = rtrim(config('app.url'), '/');
            $siteTitle = config('app.name').': catat aktivitas harian, jam demi jam';
            $siteDescription = 'Jurnal aktivitas harian dalam tampilan kalender Day, Week, dan Month. Catat apa yang kamu kerjakan per jam, per menit. Enak dipakai di HP.';
        @endphp
        <meta name="description" content="{{ $siteDescription }}">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ config('app.name') }}">
        <meta property="og:locale" content="id_ID">
        <meta property="og:title" content="{{ $siteTitle }}">
        <meta property="og:description" content="{{ $siteDescription }}">
        <meta property="og:url" content="{{ $siteUrl }}">
        <meta property="og:image" content="{{ $siteUrl }}/og-image.png">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="Tampilan kalender mingguan Journaling dengan aktivitas berwarna per kategori">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $siteTitle }}">
        <meta name="twitter:description" content="{{ $siteDescription }}">
        <meta name="twitter:image" content="{{ $siteUrl }}/og-image.png">

        <!-- Add to Home Screen -->
        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="icon" href="/favicon.ico" sizes="32x32">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <meta name="theme-color" content="#ffffff">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name') }}">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
