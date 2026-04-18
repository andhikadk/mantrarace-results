<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Event;
use App\Services\RaceResultService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CategoryResultController extends Controller
{
    public function status(Category $category): array
    {
        $category->loadMissing('result');

        return [
            'hasSnapshot' => (bool) $category->result,
            'isLocked' => $category->isResultLocked(),
            'fetchedAt' => $category->result?->fetched_at?->toIso8601String(),
            'lockedAt' => $category->result?->locked_at?->toIso8601String(),
            'totalParticipants' => $category->result?->total_participants,
        ];
    }

    public function finalize(Request $request, Category $category, RaceResultService $service): RedirectResponse
    {
        $lock = $request->boolean('lock', true);

        $service->saveSnapshot($category, $lock);

        $message = $lock
            ? 'Results finalized and locked.'
            : 'Results saved as draft (not locked).';

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', $message);
    }

    public function lock(Category $category): RedirectResponse
    {
        $category->result?->lock();

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'Results locked.');
    }

    public function unlock(Category $category): RedirectResponse
    {
        $category->result?->unlock();

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'Results unlocked.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->result?->delete();

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'Snapshot deleted.');
    }

    public function refresh(Category $category, RaceResultService $service): RedirectResponse
    {
        $service->saveSnapshot($category, false);

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'Results refreshed (draft).');
    }

    public function bulkFinalize(Request $request, Event $event, RaceResultService $service): RedirectResponse
    {
        $categoryIds = $request->input('category_ids', []);

        if (empty($categoryIds)) {
            return back()->with('error', 'No categories selected.');
        }

        $categories = $event->categories->whereIn('id', $categoryIds);
        $locked = 0;

        foreach ($categories as $category) {
            $service->saveSnapshot($category, true);
            $locked++;
        }

        return back()->with('success', "{$locked} category(ies) finalized and locked.");
    }

    public function bulkUnlock(Request $request, Event $event): RedirectResponse
    {
        $categoryIds = $request->input('category_ids', []);

        if (empty($categoryIds)) {
            return back()->with('error', 'No categories selected.');
        }

        $categories = $event->categories->whereIn('id', $categoryIds);
        $unlocked = 0;

        foreach ($categories as $category) {
            $category->result?->unlock();
            $unlocked++;
        }

        return back()->with('success', "{$unlocked} category(ies) unlocked.");
    }

    public function bulkDelete(Request $request, Event $event): RedirectResponse
    {
        $categoryIds = $request->input('category_ids', []);

        if (empty($categoryIds)) {
            return back()->with('error', 'No categories selected.');
        }

        $categories = $event->categories->whereIn('id', $categoryIds);
        $deleted = 0;

        foreach ($categories as $category) {
            $category->result?->delete();
            $deleted++;
        }

        return back()->with('success', "{$deleted} snapshot(s) deleted.");
    }
}
