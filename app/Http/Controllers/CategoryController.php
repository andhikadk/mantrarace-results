<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use App\Services\RaceResultService;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function show(Event $event, Category $category, RaceResultService $service): Response
    {
        $category->load('checkpoints');

        return Inertia::render('events/show', [
            'event' => $event,
            'categories' => $event->categories,
            'category' => $category,
            'leaderboard' => $service->getLeaderboard($category)->map->toArray(),
        ]);
    }
}
