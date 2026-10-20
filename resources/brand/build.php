<?php

// Regenerates the home screen icons and favicon in public/ from icon.svg.
// Run: php resources/brand/build.php   (needs the imagick extension)
// The share image public/og-image.png comes from og-image.html:
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --hide-scrollbars \
//     --window-size=1200,630 --screenshot=public/og-image.png resources/brand/og-image.html

$svg = file_get_contents(__DIR__.'/icon.svg');
$public = dirname(__DIR__, 2).'/public';
$rounded = str_replace('<rect width="512" height="512"', '<rect width="512" height="512" rx="112"', $svg);

$render = function (string $svg, int $size, string $path, string $format = 'png') {
    $image = new Imagick;
    $image->setBackgroundColor(new ImagickPixel('transparent'));
    $image->setResolution(288, 288);
    $image->readImageBlob($svg);
    $image->resizeImage($size, $size, Imagick::FILTER_LANCZOS, 1);
    $image->setImageFormat($format);
    $image->writeImage($path);
};

@mkdir($public.'/icons');
$render($rounded, 192, $public.'/icons/icon-192.png');
$render($rounded, 512, $public.'/icons/icon-512.png');
$render($svg, 192, $public.'/icons/icon-maskable-192.png');
$render($svg, 512, $public.'/icons/icon-maskable-512.png');
$render($svg, 180, $public.'/apple-touch-icon.png');
$render($rounded, 32, $public.'/favicon.ico', 'ico');
