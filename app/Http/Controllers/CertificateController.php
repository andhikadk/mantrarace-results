<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use App\Services\CertificateService;
use App\Services\RaceResultService;
use Illuminate\Http\Response;
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
        if (!$certificate || !$certificate->enabled) {
            abort(404, 'Certificate not available for this category');
        }

        // Get participant data
        $category->load('checkpoints');
        $participant = $this->raceResultService->getParticipant($category, $bib);

        if (!$participant) {
            abort(404, 'Participant not found');
        }

        // Generate PDF
        $pdfContent = $this->certificateService->generate($category, $participant->toArray());

        if (!$pdfContent) {
            abort(500, 'Failed to generate certificate');
        }

        // Return PDF response
        $filename = "certificate_{$category->slug}_{$bib}.pdf";
        
        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', "inline; filename=\"{$filename}\"");
    }
}
