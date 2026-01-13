<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Admin Routes
    Route::prefix('admin')->name('admin.')->group(function () {
        // Events CRUD
        Route::resource('events', Admin\EventController::class);

        // Categories CRUD (nested under events)
        Route::resource('events.categories', Admin\CategoryController::class)->shallow();

        // Checkpoints CRUD (nested under categories)
        Route::resource('categories.checkpoints', Admin\CheckpointController::class)
            ->only(['store', 'update', 'destroy'])
            ->shallow();

        // Certificate upload/update
        Route::post('categories/{category}/certificate', [Admin\CertificateController::class, 'update'])
            ->name('categories.certificate.update');
        Route::delete('categories/{category}/certificate', [Admin\CertificateController::class, 'destroy'])
            ->name('categories.certificate.destroy');

        // GPX upload/delete
        Route::post('categories/{category}/gpx', [Admin\GpxController::class, 'update'])
            ->name('categories.gpx.update');
        Route::delete('categories/{category}/gpx', [Admin\GpxController::class, 'destroy'])
            ->name('categories.gpx.destroy');

        // Font upload/list/delete
        Route::get('fonts', [Admin\FontController::class, 'index'])->name('fonts.index');
        Route::post('fonts', [Admin\FontController::class, 'store'])->name('fonts.store');
        Route::delete('fonts', [Admin\FontController::class, 'destroy'])->name('fonts.destroy');
    });
});

// Public Results Routes
// Public Results Routes
Route::get('/{event:slug}/categories/{category:slug}/certificate/{bib}', [CertificateController::class, 'show'])
    ->where('bib', '[0-9A-Za-z\-]+')
    ->name('certificates.show');

Route::get('/{event:slug}/categories/{category:slug}', [CategoryController::class, 'show'])
    ->name('categories.show');

Route::get('/{event:slug}', [EventController::class, 'show'])->name('events.show');

require __DIR__.'/settings.php';
