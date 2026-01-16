<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use App\Services\CertificateService;
use App\Services\RaceResultService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CertificateController extends Controller
{
    public function __construct(
        private CertificateService $certificateService,
        private RaceResultService $raceResultService
    ) {}

    public function show(Event $event, Category $category, string $bib): Response|StreamedResponse
    {
        abort_unless($category->event_id === $event->id, 404);

        // Check if certificate is enabled
        $certificate = $category->certificate;
        if (! $certificate || ! $certificate->enabled) {
            abort(404, 'Certificate not available for this category');
        }

        // Check availability
        $availableAt = $event->certificate_availability_date ?? $event->end_date;
        $watermarkText = null;

        if ($availableAt && now()->lessThan($availableAt)) {
            if (Auth::check()) {
                $watermarkText = 'PREVIEW';
            } else {
                abort(404, 'Certificate is not yet available.');
            }
        }

        // Define cache path
        // Use slugs for better readability and SEO-friendly paths if exposed directly
        $cachePath = "certificates/{$event->slug}/{$category->slug}/{$bib}.pdf";

        // Check if cached file exists and is fresh (less than 1 hour old)
        if (Storage::disk('public')->exists($cachePath)) {
            $lastModified = Storage::disk('public')->lastModified($cachePath);
            $oneHourAgo = now()->subHour()->getTimestamp();

            if ($lastModified > $oneHourAgo) {
                // Cache is fresh
                $pdfContent = Storage::disk('public')->get($cachePath);

                $filename = "certificate_{$category->slug}_{$bib}.pdf";
                $bytes = strlen($pdfContent);

                return response($pdfContent, 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => "inline; filename=\"{$filename}\"",
                    'Content-Length' => (string) $bytes,
                ]);
            }
        }

        // Get participant data (Only if no valid cache)
        $category->load('checkpoints');
        $participant = $this->raceResultService->getParticipant($category, $bib);

        if (! $participant) {
            abort(404, 'Participant not found');
        }

        // Check if participant has finished
        // Strict check: Status must be "FINISHED" OR finishTime must be present
        $status = strtoupper($participant->status ?? '');
        $hasFinishTime = ! empty($participant->finishTime);

        if ($status !== 'FINISHED' && ! $hasFinishTime) {
            abort(404, 'Certificate only available for finishers');
        }

        Log::info("Generating fresh certificate: {$bib}");

        // Generate PDF
        $pdfContent = $this->certificateService->generate($category, $participant->toArray(), $watermarkText);

        if (! $pdfContent) {
            Log::error("Failed to generate certificate: {$bib}");
            abort(500, 'Failed to generate certificate');
        }

        // Save to cache (Only if it's the final version, not a preview)
        if (empty($watermarkText)) {
            Storage::disk('public')->put($cachePath, $pdfContent);
        }

        // Return PDF response
        $filename = "certificate_{$category->slug}_{$bib}.pdf";
        $bytes = strlen($pdfContent);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
            'Content-Length' => (string) $bytes,
        ]);
    }
}
