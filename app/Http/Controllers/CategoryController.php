<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use App\Services\GpxParserService;
use App\Services\RaceResultService;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function show(Event $event, Category $category, RaceResultService $service, GpxParserService $gpxService): Response
    {
        abort_unless($category->event_id === $event->id, 404);

        $event->load('categories.certificate');
        $category->load('checkpoints', 'certificate');

        $gpxData = ['elevation' => [], 'waypoints' => []];
        if ($category->gpx_path) {
            $gpxData = $gpxService->parse($category->gpx_path);
        }

        $now = Carbon::now();
        $isLive = $now->between($event->start_date, $event->end_date);

        return Inertia::render('events/show', [
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
            'activeCategory' => [
                'slug' => $category->slug,
                'certificateEnabled' => $category->certificate?->enabled ?? false,
            ],
            'leaderboard' => $service->getLeaderboardPayload($category),
            'elevationData' => $gpxData['elevation'],
            'elevationWaypoints' => $gpxData['waypoints'],
            'isLive' => $isLive,
        ]);
    }
}
