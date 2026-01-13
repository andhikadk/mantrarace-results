<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
{
    public function __construct(
        private CertificateService $certificateService
    ) {}

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'template' => 'nullable|file|mimes:pdf|max:10240', // max 10MB
            'enabled' => 'boolean',
            'fields_config' => 'nullable|array',
        ]);

        $certificate = $category->certificate;
        $templatePath = $certificate?->template_path;

        // Handle file upload
        if ($request->hasFile('template')) {
            // Delete old file if exists
            if ($templatePath && Storage::disk('public')->exists($templatePath)) {
                Storage::disk('public')->delete($templatePath);
            }

            // Store new file
            $file = $request->file('template');
            $filename = "certificates/{$category->id}_{$category->slug}.".$file->getClientOriginalExtension();
            $templatePath = $file->storeAs('certificates', basename($filename), 'public');
        }

        // Validate fields config if provided
        $fieldsConfig = $validated['fields_config'] ?? $certificate?->fields_config;
        if ($fieldsConfig) {
            $errors = $this->certificateService->validateConfig($fieldsConfig);
            if (!empty($errors)) {
                return back()->withErrors(['fields_config' => implode(', ', $errors)]);
            }
        }

        $data = [
            'template_path' => $templatePath,
            'enabled' => $validated['enabled'] ?? false,
            'fields_config' => $fieldsConfig,
        ];

        if ($certificate) {
            $certificate->update($data);
        } else {
            $category->certificate()->create($data);
        }

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'Certificate settings updated.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $certificate = $category->certificate;

        if ($certificate) {
            // Delete file if exists
            if ($certificate->template_path && Storage::disk('public')->exists($certificate->template_path)) {
                Storage::disk('public')->delete($certificate->template_path);
            }

            $certificate->delete();
        }

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'Certificate template removed.');
    }
}
