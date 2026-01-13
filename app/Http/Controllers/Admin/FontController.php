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
        $extension = strtolower($file->getClientOriginalExtension());

        // Store font in public disk - mPDF can load TTF directly from here
        $path = $file->storeAs('fonts', "{$safeName}.{$extension}", 'public');

        return response()->json([
            'path' => $path,
            'name' => $originalName,
            'url' => asset('storage/'.$path),
            'fpdf_name' => $safeName, // Keep for backwards compatibility
        ]);
    }

    public function index(): JsonResponse
    {
        $fonts = [];
        $files = Storage::disk('public')->files('fonts');

        foreach ($files as $file) {
            $extension = pathinfo($file, PATHINFO_EXTENSION);
            if (in_array(strtolower($extension), ['ttf', 'otf'])) {
                $fontName = pathinfo($file, PATHINFO_FILENAME);
                $fonts[] = [
                    'path' => $file,
                    'name' => $fontName,
                    'url' => asset('storage/'.$file),
                    'fpdf_name' => Str::slug($fontName),
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

        // Delete from public storage only
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        return response()->json(['success' => true]);
    }
}
