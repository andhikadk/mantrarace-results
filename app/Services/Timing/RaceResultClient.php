<?php

namespace App\Services\Timing;

use App\Contracts\TimingSystemInterface;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
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
            $options = [
                'timeout' => config('services.raceresult.timeout', 30),
                'headers' => [
                    'Accept' => 'application/json',
                ],
            ];

            if ($this->shouldLogMetrics()) {
                $options['on_stats'] = function (TransferStats $stats) use ($endpointUrl) {
                    $handler = $stats->getHandlerStats();
                    Log::info('raceresult.http', [
                        'endpoint' => $endpointUrl,
                        'total_ms' => $stats->getTransferTime() * 1000,
                        'namelookup_ms' => ($handler['namelookup_time'] ?? 0) * 1000,
                        'connect_ms' => ($handler['connect_time'] ?? 0) * 1000,
                        'starttransfer_ms' => ($handler['starttransfer_time'] ?? 0) * 1000,
                    ]);
                };
            }

            $response = $this->http->get($endpointUrl, $options);

            $status = $response->getStatusCode();
            $contents = $response->getBody()->getContents();

            if ($status >= 400) {
                Log::warning('raceresult.http_error', [
                    'endpoint' => $endpointUrl,
                    'status' => $status,
                    'retry_after' => $response->getHeaderLine('Retry-After') ?: null,
                    'body_preview' => substr($contents, 0, 500),
                ]);

                return [];
            }

            return json_decode($contents, true) ?? [];
        } catch (RequestException $e) {
            $response = $e->getResponse();
            $status = $response?->getStatusCode();
            $body = $response ? (string) $response->getBody() : '';

            Log::error('raceresult.http_exception', [
                'endpoint' => $endpointUrl,
                'status' => $status,
                'retry_after' => $response?->getHeaderLine('Retry-After') ?: null,
                'error' => $e->getMessage(),
                'body_preview' => $body ? substr($body, 0, 500) : null,
            ]);

            return [];
        } catch (GuzzleException $e) {
            Log::error('RaceResult API error', [
                'endpoint' => $endpointUrl,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    private function shouldLogMetrics(): bool
    {
        return (bool) config('services.raceresult.log_metrics', false);
    }
}
