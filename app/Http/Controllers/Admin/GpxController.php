<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GpxController extends Controller
{
    public function update(Request $request, Category $category): RedirectResponse
    {
        $request->validate([
            'gpx_file' => 'required|file|max:10240',
        ]);

        // Delete old file if exists
        if ($category->gpx_path) {
            Storage::disk('public')->delete($category->gpx_path);
        }

        // Store new file
        $path = $request->file('gpx_file')->store('gpx', 'public');
        $category->update(['gpx_path' => $path]);

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'GPX file uploaded successfully.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->gpx_path) {
            Storage::disk('public')->delete($category->gpx_path);
            $category->update(['gpx_path' => null]);
        }

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'GPX file removed successfully.');
    }
}
