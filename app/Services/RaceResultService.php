<?php

namespace App\Services;

use App\Contracts\TimingSystemInterface;
use App\Data\CheckpointData;
use App\Data\ParticipantData;
use App\Jobs\RefreshRaceResultCache;
use App\Models\Category;
use App\Models\Checkpoint;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RaceResultService
{
    public function __construct(
        private TimingSystemInterface $client,
    ) {}

    /**
     * Get leaderboard payload for a category.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getLeaderboardPayload(Category $category): array
    {
        $payload = $this->getCachedPayload($category);

        if ($payload !== null) {
            return $payload['items'];
        }

        $payload = $this->refreshLeaderboardCache($category);

        return $payload['items'];
    }

    /**
     * Get single participant by BIB
     */
    public function getParticipant(Category $category, string $bib): ?ParticipantData
    {
        foreach ($this->getLeaderboardPayload($category) as $participant) {
            if (($participant['bib'] ?? '') === $bib) {
                return $this->participantFromArray($participant);
            }
        }

        return null;
    }

    /**
     * Force refresh leaderboard cache (sync).
     *
     * @return array{fetched_at:int,items:array<int,array<string,mixed>>}
     */
    public function refreshLeaderboardCache(Category $category): array
    {
        $cacheKey = $this->payloadCacheKey($category);
        $lockKey = $this->payloadLockKey($category);
        $lockSeconds = $this->getConfigInt('services.raceresult.refresh_lock_seconds', 20);
        $lockWaitSeconds = $this->getConfigInt('services.raceresult.refresh_lock_wait', 5);
        $staleTtl = $this->getStaleTtl();

        $lock = Cache::lock($lockKey, $lockSeconds);

        try {
            return $lock->block($lockWaitSeconds, function () use ($cacheKey, $category, $staleTtl) {
                $payload = Cache::get($cacheKey);
                if ($this->isValidPayload($payload)) {
                    return $payload;
                }

                $payload = $this->buildPayload($category);
                Cache::put($cacheKey, $payload, $staleTtl);

                return $payload;
            });
        } catch (LockTimeoutException) {
            $payload = Cache::get($cacheKey);

            if ($this->isValidPayload($payload)) {
                return $payload;
            }

            return [
                'fetched_at' => time(),
                'items' => [],
            ];
        }
    }

    /**
     * Map raw API data to ParticipantData
     *
     * @param  Collection<int, Checkpoint>  $checkpoints
     */
    private function mapParticipant(array $row, Collection $checkpoints): ParticipantData
    {
        $status = $row['Status'] ?? '';
        // Only trust rank if status is explicitly FINISHED
        $isFinished = strtolower($status) === 'finished';

        return new ParticipantData(
            overallRank: $isFinished ? (int) ($row['Overall Rank'] ?? 0) : 0,
            genderRank: $isFinished ? (int) ($row['Gender Rank'] ?? 0) : 0,
            bib: (string) ($row['BIB'] ?? ''),
            name: $this->cleanName($row['Name'] ?? ''),
            gender: $this->normalizeGender($row['GENDER'] ?? ''),
            nation: $row['Nation'] ?? '',
            club: $row['Club'] ?? '',
            finishTime: $this->cleanTimeValue($row['Finish Time'] ?? null),
            netTime: $this->cleanTimeValue($row['NetTime'] ?? null),
            gap: $row['Gap'] ?? null,
            status: $status,
            checkpoints: $this->mapCheckpoints($row, $checkpoints),
        );
    }

    /**
     * Map checkpoint data from raw row
     *
     * @param  Collection<int, Checkpoint>  $checkpoints
     * @return array<CheckpointData>
     */
    private function mapCheckpoints(array $row, Collection $checkpoints): array
    {
        return $checkpoints->map(fn (Checkpoint $cp) => new CheckpointData(
            name: $cp->name,
            time: $this->cleanTimeValue($cp->time_field ? ($row[$cp->time_field] ?? null) : null),
            segment: $this->cleanTimeValue($cp->segment_field ? ($row[$cp->segment_field] ?? null) : null),
            overallRank: $this->toNullableInt($cp->overall_rank_field ? ($row[$cp->overall_rank_field] ?? null) : null),
            genderRank: $this->toNullableInt($cp->gender_rank_field ? ($row[$cp->gender_rank_field] ?? null) : null),
        ))->all();
    }

    /**
     * Normalize gender value with exact matching and fallback logic
     * Priority:
     * 1. Exact match "Male" / "Female" (case insensitive)
     * 2. Common variations (F, P, W, Wanita, Perempuan, M, L, Pria, Laki-laki)
     * 3. Handle corrupted data (f_ma_e, etc.)
     * 4. Fallback by character count: 4 chars = Male, 6 chars = Female
     */
    private function normalizeGender(string $gender): string
    {
        $original = trim($gender);
        $lower = strtolower($original);

        // Exact matching (case insensitive)
        if ($lower === 'male' || $lower === 'm') {
            return 'Male';
        }
        if ($lower === 'female' || $lower === 'f') {
            return 'Female';
        }

        // Indonesian variations
        if (in_array($lower, ['pria', 'laki-laki', 'laki', 'l', 'cowok', 'cwo'])) {
            return 'Male';
        }
        if (in_array($lower, ['wanita', 'perempuan', 'p', 'w', 'cewek', 'cwe'])) {
            return 'Female';
        }

        // Handle corrupted data with underscores (like "F_ma_e" or "Ma_e")
        if (str_contains($lower, 'female') || str_contains($lower, 'f_ma')) {
            return 'Female';
        }
        if (str_contains($lower, 'male') || str_contains($lower, 'ma_e')) {
            return 'Male';
        }

        // Fallback by character count (after removing non-alpha chars)
        $alphaOnly = preg_replace('/[^a-zA-Z]/', '', $original);
        $length = strlen($alphaOnly);

        if ($length === 4) {
            return 'Male';
        }
        if ($length === 6) {
            return 'Female';
        }

        // If cannot determine, return original value (will be filtered out by both Male and Female filters)
        return $original ?: 'Unknown';
    }

    /**
     * Clean participant name (remove extra whitespace)
     */
    private function cleanName(string $name): string
    {
        // Replace underscores with nothing (corrupted data)
        $name = str_replace('_', '', $name);

        // Trim and normalize whitespace
        return trim(preg_replace('/\s+/', ' ', $name));
    }

    /**
     * Clean time value (handle corrupted data with underscores)
     */
    private function cleanTimeValue(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        // Replace underscores with colons (common corruption)
        $cleaned = str_replace('_', ':', $value);

        // Remove double colons
        $cleaned = preg_replace('/:{2,}/', ':', $cleaned);

        // Trim leading/trailing colons
        return trim($cleaned, ':');
    }

    private function toNullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '' || $value === 'N/A' || $value === '-') {
            return null;
        }

        return (int) $value;
    }

    /**
     * @return array{fetched_at:int,items:array<int,array<string,mixed>>}|null
     */
    private function getCachedPayload(Category $category): ?array
    {
        $cacheKey = $this->payloadCacheKey($category);
        $payload = Cache::get($cacheKey);

        if (! $this->isValidPayload($payload)) {
            if ($this->shouldLogMetrics()) {
                Log::info('raceresult.cache', [
                    'category_id' => $category->id,
                    'status' => 'miss',
                ]);
            }

            return null;
        }

        $age = time() - (int) $payload['fetched_at'];
        $cacheTtl = $this->getCacheTtl();
        $staleTtl = $this->getStaleTtl();

        if ($age <= $cacheTtl) {
            if ($this->shouldLogMetrics()) {
                Log::info('raceresult.cache', [
                    'category_id' => $category->id,
                    'status' => 'hit',
                    'age' => $age,
                    'cache_ttl' => $cacheTtl,
                ]);
            }

            return $payload;
        }

        if ($age <= $staleTtl) {
            if ($this->shouldLogMetrics()) {
                Log::info('raceresult.cache', [
                    'category_id' => $category->id,
                    'status' => 'stale',
                    'age' => $age,
                    'cache_ttl' => $cacheTtl,
                    'stale_ttl' => $staleTtl,
                ]);
            }

            $this->dispatchRefreshIfNeeded($category);

            return $payload;
        }

        if ($this->shouldLogMetrics()) {
            Log::info('raceresult.cache', [
                'category_id' => $category->id,
                'status' => 'expired',
                'age' => $age,
                'stale_ttl' => $staleTtl,
            ]);
        }

        return null;
    }

    /**
     * @return array{fetched_at:int,items:array<int,array<string,mixed>>}
     */
    private function buildPayload(Category $category): array
    {
        $start = microtime(true);
        $rawData = $this->client->fetchResults($category->endpoint_url);

        if ($this->shouldLogMetrics()) {
            Log::info('raceresult.fetch', [
                'category_id' => $category->id,
                'count' => count($rawData),
                'ms' => (microtime(true) - $start) * 1000,
            ]);
        }

        $checkpoints = $category->checkpoints;
        $mapStart = microtime(true);
        $mapped = collect($rawData)
            ->map(fn (array $row) => $this->mapParticipant($row, $checkpoints));

        // Check if anyone has reached CP1 (index 0)
        $hasCp1 = $mapped->contains(function (ParticipantData $p) {
            return isset($p->checkpoints[0]) && ! empty($p->checkpoints[0]->time);
        });

        $mapped = $mapped->sort(function (ParticipantData $a, ParticipantData $b) use ($hasCp1) {
            // If race hasn't started or no one passed CP1, sort by BIB
            if (! $hasCp1) {
                // Remove non-numeric characters for proper numeric sorting if needed,
                // but BIB is string so natural sort is best
                return strnatcmp($a->bib, $b->bib);
            }

            // Normal leaderboard sorting
            $rankA = $a->overallRank > 0 ? $a->overallRank : PHP_INT_MAX;
            $rankB = $b->overallRank > 0 ? $b->overallRank : PHP_INT_MAX;

            if ($rankA === $rankB) {
                return strnatcmp($a->bib, $b->bib);
            }

            return $rankA <=> $rankB;
        })
            ->values();

        if ($this->shouldLogMetrics()) {
            Log::info('raceresult.map', [
                'category_id' => $category->id,
                'ms' => (microtime(true) - $mapStart) * 1000,
            ]);
        }

        return [
            'fetched_at' => time(),
            'items' => $mapped->map->toArray()->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function participantFromArray(array $payload): ParticipantData
    {
        return new ParticipantData(
            overallRank: (int) ($payload['overallRank'] ?? 0),
            genderRank: (int) ($payload['genderRank'] ?? 0),
            bib: (string) ($payload['bib'] ?? ''),
            name: (string) ($payload['name'] ?? ''),
            gender: (string) ($payload['gender'] ?? ''),
            nation: (string) ($payload['nation'] ?? ''),
            club: (string) ($payload['club'] ?? ''),
            finishTime: $payload['finishTime'] ?? null,
            netTime: $payload['netTime'] ?? null,
            gap: $payload['gap'] ?? null,
            status: (string) ($payload['status'] ?? ''),
            checkpoints: array_map(
                fn (array $cp) => new CheckpointData(
                    name: (string) ($cp['name'] ?? ''),
                    time: $cp['time'] ?? null,
                    segment: $cp['segment'] ?? null,
                    overallRank: $this->toNullableInt($cp['overallRank'] ?? null),
                    genderRank: $this->toNullableInt($cp['genderRank'] ?? null),
                ),
                $payload['checkpoints'] ?? []
            ),
        );
    }

    private function payloadCacheKey(Category $category): string
    {
        return "raceresult:{$category->id}:payload";
    }

    private function payloadLockKey(Category $category): string
    {
        return "raceresult:{$category->id}:lock";
    }

    private function refreshThrottleKey(Category $category): string
    {
        return "raceresult:{$category->id}:refreshing";
    }

    private function dispatchRefreshIfNeeded(Category $category): void
    {
        if (! config('services.raceresult.refresh_async', true)) {
            return;
        }

        $cooldown = $this->getConfigInt('services.raceresult.refresh_cooldown', 15);
        if (! Cache::add($this->refreshThrottleKey($category), true, $cooldown)) {
            return;
        }

        RefreshRaceResultCache::dispatch($category->id);
    }

    private function isValidPayload(mixed $payload): bool
    {
        return is_array($payload)
            && isset($payload['fetched_at'], $payload['items'])
            && is_array($payload['items']);
    }

    private function getCacheTtl(): int
    {
        return max(1, $this->getConfigInt('services.raceresult.cache_ttl', 30));
    }

    private function getStaleTtl(): int
    {
        $cacheTtl = $this->getCacheTtl();
        $staleTtl = $this->getConfigInt('services.raceresult.stale_ttl', 300);

        return max($cacheTtl, $staleTtl);
    }

    private function shouldLogMetrics(): bool
    {
        return (bool) config('services.raceresult.log_metrics', false);
    }

    private function getConfigInt(string $key, int $default): int
    {
        return (int) config($key, $default);
    }
}
