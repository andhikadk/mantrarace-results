<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use App\Services\CertificateService;
use App\Services\RaceResultService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CertificateController extends Controller
{
    public function __construct(
        private CertificateService $certificateService,
        private RaceResultService $raceResultService
    ) {}

    public function show(Event $event, Category $category, string $bib): Response|StreamedResponse
    {
        // Check if certificate is enabled
        $certificate = $category->certificate;
        if (! $certificate || ! $certificate->enabled) {
            abort(404, 'Certificate not available for this category');
        }

        // Get participant data
        $category->load('checkpoints');
        $participant = $this->raceResultService->getParticipant($category, $bib);

        if (! $participant) {
            abort(404, 'Participant not found');
        }

        // Generate PDF
        $pdfContent = $this->certificateService->generate($category, $participant->toArray());

        if (! $pdfContent) {
            abort(500, 'Failed to generate certificate');
        }

        // Return PDF response
        $filename = "certificate_{$category->slug}_{$bib}.pdf";
        $bytes = strlen($pdfContent);
        Log::info('certificate.response', [
            'category_id' => $category->id,
            'bib' => $bib,
            'bytes' => $bytes,
        ]);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
            'Content-Length' => (string) $bytes,
        ]);
    }
}
