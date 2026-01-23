<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsResultsPayload;
use App\Models\Category;
use App\Models\Event;
use App\Services\GpxParserService;
use App\Services\RaceResultService;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    use BuildsResultsPayload;

    public function show(Event $event, Category $category, RaceResultService $service, GpxParserService $gpxService): Response
    {
        abort_unless($category->event_id === $event->id, 404);

        $payload = $this->buildResultsPayload($event, $category, $service, $gpxService);

        return Inertia::render('events/show', $payload);
    }
}
