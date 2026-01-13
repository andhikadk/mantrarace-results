<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use App\Services\RaceResultService;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function show(Event $event, Category $category, RaceResultService $service): Response
    {
        $event->load('categories.certificate');
        $category->load('checkpoints', 'certificate');

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
            'activeCategory' => [
                'slug' => $category->slug,
                'certificateEnabled' => $category->certificate?->enabled ?? false,
            ],
            'leaderboard' => $service->getLeaderboard($category)->map->toArray(),
            'isLive' => $isLive,
        ]);
    }
}
