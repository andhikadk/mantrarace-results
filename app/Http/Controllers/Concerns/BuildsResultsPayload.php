<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Category;
use App\Models\Event;
use App\Services\GpxParserService;
use App\Services\RaceResultService;
use Carbon\Carbon;

trait BuildsResultsPayload
{
    /**
     * Build shared payload for the results page.
     *
     * @return array<string, mixed>
     */
    protected function buildResultsPayload(
        Event $event,
        ?Category $category,
        RaceResultService $raceService,
        GpxParserService $gpxService,
        bool $forceRefresh = false
    ): array {
        $event->loadMissing('categories.certificate');

        if ($category) {
            $category->loadMissing('checkpoints', 'certificate');
        }

        $leaderboard = [];
        if ($category) {
            if ($forceRefresh) {
                $leaderboardPayload = $raceService->refreshLeaderboardCache($category, true);
                $leaderboard = $leaderboardPayload['items'] ?? [];
            } else {
                $leaderboard = $raceService->getLeaderboardPayload($category);
            }
        }

        $gpxData = ['elevation' => [], 'waypoints' => []];
        if ($category && $category->gpx_path) {
            $gpxData = $gpxService->parse($category->gpx_path);
        }

        $now = Carbon::now();
        $isLive = $now->between($event->start_date, $event->end_date);

        return [
            'event' => $event,
            'categories' => $event->categories->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'certificateEnabled' => $cat->certificate?->enabled ?? false,
                'hasGpx' => (bool) $cat->gpx_path,
                'totalDistance' => $cat->total_distance,
                'totalElevationGain' => $cat->total_elevation_gain,
            ]),
            'activeCategory' => $category ? [
                'slug' => $category->slug,
                'certificateEnabled' => $category->certificate?->enabled ?? false,
            ] : null,
            'leaderboard' => $leaderboard,
            'elevationData' => $gpxData['elevation'],
            'elevationWaypoints' => $gpxData['waypoints'],
            'isLive' => $isLive,
        ];
    }
}
