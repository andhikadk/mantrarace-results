<?php

namespace App\Jobs;

use App\Models\Category;
use App\Services\RaceResultService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RefreshRaceResultCache implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private int $categoryId) {}

    public function handle(RaceResultService $service): void
    {
        $category = Category::with('checkpoints')->find($this->categoryId);

        if (! $category) {
            return;
        }

        $service->refreshLeaderboardCache($category);
    }
}
