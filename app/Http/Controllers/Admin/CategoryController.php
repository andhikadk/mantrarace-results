<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Event $event): RedirectResponse
    {
        return redirect()->route('admin.events.show', $event);
    }

    public function create(Event $event): Response
    {
        return Inertia::render('admin/categories/create', [
            'event' => $event,
        ]);
    }

    public function store(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'endpoint_url' => 'required|url|max:500',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Ensure unique slug within event
        $validated['slug'] = $this->ensureUniqueSlug($event, $validated['slug']);

        $event->categories()->create($validated);

        return redirect()
            ->route('admin.events.show', $event)
            ->with('success', 'Category created successfully.');
    }

    public function show(Category $category): RedirectResponse
    {
        return redirect()->route('admin.categories.edit', $category);
    }

    public function edit(Category $category): Response
    {
        $category->load(['event', 'checkpoints', 'certificate']);

        return Inertia::render('admin/categories/edit', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'endpoint_url' => 'required|url|max:500',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Ensure unique slug within event (excluding current category)
        if ($validated['slug'] !== $category->slug) {
            $validated['slug'] = $this->ensureUniqueSlug($category->event, $validated['slug'], $category->id);
        }

        $category->update($validated);

        return redirect()
            ->route('admin.events.show', $category->event)
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $event = $category->event;
        $category->delete();

        return redirect()
            ->route('admin.events.show', $event)
            ->with('success', 'Category deleted successfully.');
    }

    private function ensureUniqueSlug(Event $event, string $slug, ?int $excludeId = null): string
    {
        $query = $event->categories()->where('slug', $slug);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        if (! $query->exists()) {
            return $slug;
        }

        $counter = 1;
        while ($event->categories()->where('slug', $slug.'-'.$counter)->exists()) {
            $counter++;
        }

        return $slug.'-'.$counter;
    }
}
