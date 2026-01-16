<?php

namespace App\Providers;

use App\Contracts\TimingSystemInterface;
use App\Models\User;
use App\Services\Timing\RaceResultClient;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Opcodes\LogViewer\Facades\LogViewer;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(TimingSystemInterface::class, RaceResultClient::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        LogViewer::auth(function ($request) {
            return $request->user() && $request->user()->id === 1;
        });

        Gate::define('viewPulse', function (User $user) {
            return $user->id === 1;
        });
    }
}
