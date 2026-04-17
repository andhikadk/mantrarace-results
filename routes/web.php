<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('events', Admin\EventController::class);

        Route::resource('events.categories', Admin\CategoryController::class)->shallow();

        Route::resource('categories.checkpoints', Admin\CheckpointController::class)
            ->only(['store', 'update', 'destroy'])
            ->shallow();

        Route::post('categories/{category}/certificate', [Admin\CertificateController::class, 'update'])
            ->name('categories.certificate.update');
        Route::delete('categories/{category}/certificate', [Admin\CertificateController::class, 'destroy'])
            ->name('categories.certificate.destroy');
        Route::post('categories/{category}/certificate/preview', [Admin\CertificateController::class, 'preview'])
            ->name('categories.certificate.preview');

        Route::post('categories/{category}/gpx', [Admin\GpxController::class, 'update'])
            ->name('categories.gpx.update');
        Route::delete('categories/{category}/gpx', [Admin\GpxController::class, 'destroy'])
            ->name('categories.gpx.destroy');

        Route::get('categories/{category}/results/status', [Admin\CategoryResultController::class, 'status'])
            ->name('categories.results.status');
        Route::post('categories/{category}/results/finalize', [Admin\CategoryResultController::class, 'finalize'])
            ->name('categories.results.finalize');
        Route::post('categories/{category}/results/lock', [Admin\CategoryResultController::class, 'lock'])
            ->name('categories.results.lock');
        Route::post('categories/{category}/results/unlock', [Admin\CategoryResultController::class, 'unlock'])
            ->name('categories.results.unlock');
        Route::post('categories/{category}/results/refresh', [Admin\CategoryResultController::class, 'refresh'])
            ->name('categories.results.refresh');
        Route::delete('categories/{category}/results', [Admin\CategoryResultController::class, 'destroy'])
            ->name('categories.results.destroy');

        Route::get('fonts', [Admin\FontController::class, 'index'])->name('fonts.index');
        Route::post('fonts', [Admin\FontController::class, 'store'])->name('fonts.store');
        Route::delete('fonts', [Admin\FontController::class, 'destroy'])->name('fonts.destroy');

        // DEBUG ROUTE - REMOVE AFTER TESTING
        Route::get('debug/category/{category:slug}', function (App\Models\Category $category) {
            $category->load('event');

            return [
                'category' => $category,
                'event' => $category->event,
                'is_lap_based_value' => $category->event?->is_lap_based,
            ];
        });
    });
});

Route::get('/{event:slug}/categories/{category:slug}/certificate/{bib}', [CertificateController::class, 'show'])
    ->where('bib', '[0-9A-Za-z\-]+')
    ->name('certificates.show');

Route::get('/{event:slug}/categories/{category:slug}', [CategoryController::class, 'show'])
    ->name('categories.show');

Route::get('/{event:slug}', [EventController::class, 'show'])->name('events.show');

require __DIR__.'/settings.php';
