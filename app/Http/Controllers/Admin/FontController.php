<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FontController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'font' => 'required|file|max:10240',
        ]);

        $file = $request->file('font');
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = Str::slug($originalName);
        $extension = $file->getClientOriginalExtension();
        $filename = "fonts/{$safeName}_{$extension}.{$extension}";

        // Store the font file
        $path = $file->storeAs('fonts', basename($filename), 'public');

        return response()->json([
            'path' => $path,
            'name' => $originalName,
            'url' => asset('storage/'.$path),
        ]);
    }

    public function index(): JsonResponse
    {
        $fonts = [];
        $files = Storage::disk('public')->files('fonts');

        foreach ($files as $file) {
            $extension = pathinfo($file, PATHINFO_EXTENSION);
            if (in_array(strtolower($extension), ['ttf', 'otf'])) {
                $fonts[] = [
                    'path' => $file,
                    'name' => pathinfo($file, PATHINFO_FILENAME),
                    'url' => asset('storage/'.$file),
                ];
            }
        }

        return response()->json($fonts);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        $path = $request->input('path');

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);

            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'Font not found'], 404);
    }
}
