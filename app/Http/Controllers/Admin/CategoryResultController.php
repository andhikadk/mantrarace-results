<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
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
}
