<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Checkpoint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CheckpointController extends Controller
{
    public function store(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'order_index' => 'required|integer|min:1',
            'name' => 'required|string|max:255',
            'time_field' => 'required|string|max:255',
            'segment_field' => 'nullable|string|max:255',
            'overall_rank_field' => 'nullable|string|max:255',
            'gender_rank_field' => 'nullable|string|max:255',
        ]);

        // Ensure unique order_index within category
        if ($category->checkpoints()->where('order_index', $validated['order_index'])->exists()) {
            return back()->withErrors(['order_index' => 'This order index is already used.']);
        }

        $category->checkpoints()->create($validated);

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'Checkpoint created successfully.');
    }

    public function update(Request $request, Checkpoint $checkpoint): RedirectResponse
    {
        $validated = $request->validate([
            'order_index' => 'required|integer|min:1',
            'name' => 'required|string|max:255',
            'time_field' => 'required|string|max:255',
            'segment_field' => 'nullable|string|max:255',
            'overall_rank_field' => 'nullable|string|max:255',
            'gender_rank_field' => 'nullable|string|max:255',
        ]);

        // Ensure unique order_index within category (excluding current)
        $exists = $checkpoint->category->checkpoints()
            ->where('order_index', $validated['order_index'])
            ->where('id', '!=', $checkpoint->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['order_index' => 'This order index is already used.']);
        }

        $checkpoint->update($validated);

        return redirect()
            ->route('admin.categories.edit', $checkpoint->category)
            ->with('success', 'Checkpoint updated successfully.');
    }

    public function destroy(Checkpoint $checkpoint): RedirectResponse
    {
        $category = $checkpoint->category;
        $checkpoint->delete();

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'Checkpoint deleted successfully.');
    }
}
