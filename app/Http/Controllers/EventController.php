<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\RaceResultService;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function show(Event $event, RaceResultService $service): Response
    {
        $event->load('categories.checkpoints', 'categories.certificate');
        $defaultCategory = $event->categories->first();

        $leaderboard = $defaultCategory
            ? $service->getLeaderboard($defaultCategory)
            : collect();

        $now = Carbon::now();
        $isLive = $now->between($event->start_date, $event->end_date);

        return Inertia::render('events/show', [
            'event' => $event,
            'categories' => $event->categories->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'certificateEnabled' => $cat->certificate?->enabled ?? false,
            ]),
            'activeCategory' => $defaultCategory ? [
                'slug' => $defaultCategory->slug,
                'certificateEnabled' => $defaultCategory->certificate?->enabled ?? false,
            ] : null,
            'leaderboard' => $leaderboard->map->toArray(),
            'isLive' => $isLive,
        ]);
    }
}

