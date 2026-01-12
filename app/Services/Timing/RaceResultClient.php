<?php

namespace App\Services\Timing;

use App\Contracts\TimingSystemInterface;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class RaceResultClient implements TimingSystemInterface
{
    public function __construct(
        private Client $http,
    ) {}

    /**
     * Fetch results from RaceResult timing system API
     *
     * @return array<int, array<string, mixed>>
     */
    public function fetchResults(string $endpointUrl): array
    {
        try {
            $response = $this->http->get($endpointUrl, [
                'timeout' => config('services.raceresult.timeout', 30),
                'headers' => [
                    'Accept' => 'application/json',
                ],
            ]);

            $contents = $response->getBody()->getContents();

            return json_decode($contents, true) ?? [];
        } catch (GuzzleException $e) {
            Log::error('RaceResult API error', [
                'endpoint' => $endpointUrl,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
