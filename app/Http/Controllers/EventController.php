<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\GpxParserService;
use App\Services\RaceResultService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function show(Event $event, Request $request, RaceResultService $raceService, GpxParserService $gpxService): Response
    {
        $event->load('categories.checkpoints', 'categories.certificate');
        $requestedCategory = $request->query('category');
        $categories = $event->categories->sortBy('id');

        $defaultCategory = $requestedCategory
            ? ($categories->firstWhere('slug', $requestedCategory) ?? $categories->first())
            : $categories->first();

        $leaderboard = $defaultCategory
            ? $raceService->getLeaderboardPayload($defaultCategory)
            : [];

        $shouldRefresh = $request->boolean('refresh') || $request->header('X-Force-Refresh');

        if ($shouldRefresh && $defaultCategory) {
            $leaderboardpayload = $raceService->refreshLeaderboardCache($defaultCategory, true);
            $leaderboard = $leaderboardpayload['items'];
        }

        $gpxData = ['elevation' => [], 'waypoints' => []];
        if ($defaultCategory && $defaultCategory->gpx_path) {
            $gpxData = $gpxService->parse($defaultCategory->gpx_path);
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
            ]),
            'activeCategory' => $defaultCategory ? [
                'slug' => $defaultCategory->slug,
                'certificateEnabled' => $defaultCategory->certificate?->enabled ?? false,
            ] : null,
            'leaderboard' => $leaderboard,
            'elevationData' => $gpxData['elevation'],
            'elevationWaypoints' => $gpxData['waypoints'],
            'isLive' => $isLive,
        ]);
    }
}
