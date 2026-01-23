<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsResultsPayload;
use App\Models\Event;
use App\Services\GpxParserService;
use App\Services\RaceResultService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    use BuildsResultsPayload;

    public function show(Event $event, Request $request, RaceResultService $raceService, GpxParserService $gpxService): Response
    {
        $requestedCategory = $request->query('category');
        $categories = $event->categories->sortBy('id');

        $defaultCategory = $requestedCategory
            ? ($categories->firstWhere('slug', $requestedCategory) ?? $categories->first())
            : $categories->first();

        $shouldRefresh = $defaultCategory && ($request->boolean('refresh') || $request->header('X-Force-Refresh'));
        $payload = $this->buildResultsPayload($event, $defaultCategory, $raceService, $gpxService, $shouldRefresh);

        return Inertia::render('events/show', $payload);
    }
}
