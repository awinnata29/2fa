<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('home', ['page' => 'authenticator']);
})->name('home');

Route::get('/check-live-uid-facebook', function () {
    return view('home', ['page' => 'uid']);
})->name('check-uid');

Route::get('/sitemap.xml', function () {
    $lastModified = now()->toAtomString();
    $urls = [
        ['loc' => route('home'), 'priority' => '1.0'],
        ['loc' => route('check-uid'), 'priority' => '0.8'],
    ];

    return response()
        ->view('sitemap', compact('urls', 'lastModified'))
        ->header('Content-Type', 'application/xml');
})->name('sitemap');
