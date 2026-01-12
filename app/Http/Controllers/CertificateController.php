<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use App\Services\RaceResultService;
use Illuminate\Http\JsonResponse;

class CertificateController extends Controller
{
    public function show(Event $event, Category $category, string $bib, RaceResultService $service): JsonResponse
    {
        $category->load('checkpoints');
        $participant = $service->getParticipant($category, $bib);

        if (! $participant) {
            abort(404, 'Participant not found');
        }

        // TODO: PDF generation (Phase 2)
        return response()->json($participant->toArray());
    }
}
