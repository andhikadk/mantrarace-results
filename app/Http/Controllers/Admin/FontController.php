<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FontConverter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FontController extends Controller
{
    public function __construct(
        private FontConverter $fontConverter
    ) {}

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'font' => 'required|file|max:10240',
        ]);

        $file = $request->file('font');
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = Str::slug($originalName);
        $extension = $file->getClientOriginalExtension();
        $filename = "fonts/{$safeName}.{$extension}";

        // Store the original font file in public disk (for browser preview)
        $path = $file->storeAs('fonts', basename($filename), 'public');

        // Convert to FPDF format and store in storage/app/fonts
        $fullPath = Storage::disk('public')->path($path);

        try {
            $fpdfFontName = $this->fontConverter->convertToFpdfFormat($fullPath, $originalName);

            return response()->json([
                'path' => $path,
                'name' => $originalName,
                'url' => asset('storage/'.$path),
                'fpdf_name' => $fpdfFontName,
            ]);
        } catch (\Exception $e) {
            // If conversion fails, delete the uploaded file
            Storage::disk('public')->delete($path);

            return response()->json([
                'error' => 'Failed to convert font: ' . $e->getMessage()
            ], 500);
        }
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
        $fontName = pathinfo($path, PATHINFO_FILENAME);

        // Delete from public storage
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        // Also delete the converted FPDF font files
        $fpdfPhpFile = storage_path("fonts/" . Str::slug($fontName) . ".php");
        $fpdfTtfFile = storage_path("fonts/" . Str::slug($fontName) . ".ttf");

        if (file_exists($fpdfPhpFile)) {
            unlink($fpdfPhpFile);
        }
        if (file_exists($fpdfTtfFile)) {
            unlink($fpdfTtfFile);
        }

        return response()->json(['success' => true]);
    }
}
