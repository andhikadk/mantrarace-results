<?php

namespace App\Services\Timing;

use App\Contracts\TimingSystemInterface;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\TransferStats;
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
                'on_stats' => function (TransferStats $stats) use ($endpointUrl) {
                    $handler = $stats->getHandlerStats();
                    Log::info('raceresult.http', [
                        'endpoint' => $endpointUrl,
                        'total_ms' => $stats->getTransferTime() * 1000,
                        'namelookup_ms' => ($handler['namelookup_time'] ?? 0) * 1000,
                        'connect_ms' => ($handler['connect_time'] ?? 0) * 1000,
                        'starttransfer_ms' => ($handler['starttransfer_time'] ?? 0) * 1000,
                    ]);
                },
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
