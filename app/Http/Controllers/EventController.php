<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\RaceResultService;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function show(Event $event, RaceResultService $service): Response
    {
        $event->load('categories.checkpoints');
        $defaultCategory = $event->categories->first();

        $leaderboard = $defaultCategory
            ? $service->getLeaderboard($defaultCategory)
            : collect();

        return Inertia::render('events/show', [
            'event' => $event,
            'categories' => $event->categories,
            'category' => $defaultCategory,
            'leaderboard' => $leaderboard->map->toArray(),
        ]);
    }
}
