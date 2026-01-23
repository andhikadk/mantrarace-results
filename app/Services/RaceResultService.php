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
    public function refreshLeaderboardCache(Category $category, bool $force = false): array
    {
        $cacheKey = $this->payloadCacheKey($category);
        $lockKey = $this->payloadLockKey($category);
        $lockSeconds = $this->getConfigInt('services.raceresult.refresh_lock_seconds', 20);
        $lockWaitSeconds = $this->getConfigInt('services.raceresult.refresh_lock_wait', 5);
        $staleTtl = $this->getStaleTtl();

        $lock = Cache::lock($lockKey, $lockSeconds);

        try {
            return $lock->block($lockWaitSeconds, function () use ($cacheKey, $category, $staleTtl, $force) {
                // If not forcing, check if we already have fresh data (handle thundering herd)
                if (! $force) {
                    $payload = Cache::get($cacheKey);
                    if ($this->isValidPayload($payload)) {
                        return $payload;
                    }
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
     * @param  \DateTimeInterface|null  $startTime  Race start datetime
     * @param  \DateTimeInterface|null  $cutOffTime  Cut off datetime
     * @param  bool  $isEventEnded  Whether the event has ended
     */
    private function mapParticipant(array $row, Collection $checkpoints, ?\DateTimeInterface $startTime, ?\DateTimeInterface $cutOffTime, bool $isEventEnded = false): ParticipantData
    {
        $status = $row['Status'] ?? '';

        // Convert "Yet to Start" to "DNS" if event has ended
        if ($isEventEnded && $this->isYetToStartStatus($status)) {
            $status = 'DNS';
        }
        $finishTime = $this->cleanTimeValue($row['Finish Time'] ?? null);
        $isFinished = $this->isFinishedStatus($status);

        // Check COT: If finished but elapsed time exceeds cut off time
        $isCot = false;
        if ($isFinished && $startTime && $cutOffTime && $finishTime) {
            $cutOffSeconds = $cutOffTime->getTimestamp() - $startTime->getTimestamp();
            $finishSeconds = $this->timeToSeconds($finishTime);
            Log::debug('COT Check', [
                'bib' => $row['BIB'] ?? '',
                'startTime' => $startTime?->format('Y-m-d H:i:s'),
                'cutOffTime' => $cutOffTime?->format('Y-m-d H:i:s'),
                'cutOffSeconds' => $cutOffSeconds,
                'finishTime' => $finishTime,
                'finishSeconds' => $finishSeconds,
                'isCot' => $finishSeconds > $cutOffSeconds,
            ]);
            if ($cutOffSeconds > 0 && $finishSeconds > $cutOffSeconds) {
                $isCot = true;
            }
        }

        return new ParticipantData(
            overallRank: $isFinished ? (int) ($row['Overall Rank'] ?? 0) : 0,
            genderRank: $isFinished ? (int) ($row['Gender Rank'] ?? 0) : 0,
            bib: (string) ($row['BIB'] ?? ''),
            name: $this->cleanName($row['Name'] ?? ''),
            gender: $this->normalizeGender($row['GENDER'] ?? ''),
            nation: $row['Nation'] ?? '',
            club: $row['Club'] ?? '',
            finishTime: $finishTime,
            netTime: $this->cleanTimeValue($row['NetTime'] ?? null),
            gap: $this->cleanTimeValue($row['Gap'] ?? null),
            status: $status,
            checkpoints: $this->mapCheckpoints($row, $checkpoints),
            isCot: $isCot,
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
            distance: $cp->distance,
            elevationGain: $cp->elevation_gain,
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
     * Clean time value (handle corrupted data with underscores and placeholder templates)
     */
    private function cleanTimeValue(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        // Detect placeholder/template format like "[4|HH:mm:ss]", "[0|HH:mm:ss]"
        // These indicate the checkpoint hasn't been reached yet
        if (preg_match('/^\[\d+\|[^\]]+\]$/', $value)) {
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

    private function isFinishedStatus(string $status): bool
    {
        $normalized = strtoupper(str_replace('_', ' ', trim($status)));

        return $normalized === 'FINISHED' || str_starts_with($normalized, 'FIN');
    }

    private function isYetToStartStatus(string $status): bool
    {
        $normalized = strtoupper(str_replace('_', ' ', trim($status)));

        return $normalized === 'YET TO START' || str_starts_with($normalized, 'YET');
    }

    private function isDnfOrDnsStatus(string $status): bool
    {
        $normalized = strtoupper(str_replace('_', ' ', trim($status)));

        return $normalized === 'DNF'
            || $normalized === 'DNS'
            || str_starts_with($normalized, 'DNF')
            || str_starts_with($normalized, 'DNS')
            || str_contains($normalized, 'WITHDRAWN');
    }

    private function isDnfStatus(string $status): bool
    {
        $normalized = strtoupper(str_replace('_', ' ', trim($status)));

        return $normalized === 'DNF'
            || str_starts_with($normalized, 'DNF')
            || str_contains($normalized, 'WITHDRAWN');
    }

    private function isCotStatus(string $status): bool
    {
        return strtoupper(trim($status)) === 'COT';
    }

    /**
     * Convert time string (HH:MM:SS, MM:SS, or H:MM:SS) to total seconds
     * Returns PHP_INT_MAX for invalid/empty times so they sort to the bottom
     */
    private function timeToSeconds(?string $time): int
    {
        if ($time === null || $time === '') {
            return PHP_INT_MAX;
        }

        $parts = explode(':', $time);
        $count = count($parts);

        if ($count === 3) {
            // HH:MM:SS or H:MM:SS
            return (int) $parts[0] * 3600 + (int) $parts[1] * 60 + (int) $parts[2];
        } elseif ($count === 2) {
            // MM:SS
            return (int) $parts[0] * 60 + (int) $parts[1];
        }

        return PHP_INT_MAX;
    }

    /**
     * @return array{fetched_at:int,items:array<int,array<string,mixed>>}|null
     */
    private function getCachedPayload(Category $category): ?array
    {
        $start = microtime(true);
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
                    'ms' => (microtime(true) - $start) * 1000,
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
        $startTime = $category->start_time;
        $cutOffTime = $category->cut_off_time;

        // Check if event has ended (use end_date, fallback to start_date)
        $eventDate = $category->event?->end_date ?? $category->event?->start_date;
        $isEventEnded = $eventDate && $eventDate->isPast();

        $mapStart = microtime(true);
        $mapped = collect($rawData)
            ->map(fn (array $row) => $this->mapParticipant($row, $checkpoints, $startTime, $cutOffTime, $isEventEnded));

        $mapped = $mapped->sort(function (ParticipantData $a, ParticipantData $b) {
            $isFinishedA = $this->isFinishedStatus($a->status);
            $isFinishedB = $this->isFinishedStatus($b->status);
            $isDnfDnsA = $this->isDnfOrDnsStatus($a->status);
            $isDnfDnsB = $this->isDnfOrDnsStatus($b->status);

            // 0. DNF/DNS/Withdrawn always at the bottom
            if ($isDnfDnsA !== $isDnfDnsB) {
                return $isDnfDnsA ? 1 : -1;
            }
            // If both are DNF/DNS, sort DNF before DNS, then by BIB
            if ($isDnfDnsA && $isDnfDnsB) {
                $isDnfA = $this->isDnfStatus($a->status);
                $isDnfB = $this->isDnfStatus($b->status);

                // DNF comes before DNS
                if ($isDnfA !== $isDnfB) {
                    return $isDnfA ? -1 : 1;
                }

                return strnatcmp($a->bib, $b->bib);
            }

            // 1. Priority: Finished Participants - Sort by finish time
            if ($isFinishedA && $isFinishedB) {
                // Convert finish times to seconds for proper comparison
                $secondsA = $this->timeToSeconds($a->finishTime);
                $secondsB = $this->timeToSeconds($b->finishTime);

                if ($secondsA === $secondsB) {
                    return strnatcmp($a->bib, $b->bib);
                }

                return $secondsA <=> $secondsB;
            }
            if ($isFinishedA) {
                return -1;
            }
            if ($isFinishedB) {
                return 1;
            }

            // 2. Priority: Furthest Checkpoint Reached (Last Position)
            // Calculate last reached CP index for A
            $lastCpIndexA = -1;
            foreach ($a->checkpoints as $index => $cp) {
                if (! empty($cp->time)) {
                    $lastCpIndexA = $index;
                }
            }

            // Calculate last reached CP index for B
            $lastCpIndexB = -1;
            foreach ($b->checkpoints as $index => $cp) {
                if (! empty($cp->time)) {
                    $lastCpIndexB = $index;
                }
            }

            if ($lastCpIndexA !== $lastCpIndexB) {
                // Higher index (further distance) comes first
                return $lastCpIndexB <=> $lastCpIndexA;
            }

            // 3. Same checkpoint: Sort by rank at that checkpoint
            if ($lastCpIndexA >= 0) {
                $rawRankA = $a->checkpoints[$lastCpIndexA]->overallRank;
                $rawRankB = $b->checkpoints[$lastCpIndexB]->overallRank;

                // Treat null or negative ranks as invalid (should go to bottom)
                $cpRankA = ($rawRankA !== null && $rawRankA > 0) ? $rawRankA : PHP_INT_MAX;
                $cpRankB = ($rawRankB !== null && $rawRankB > 0) ? $rawRankB : PHP_INT_MAX;

                if ($cpRankA !== $cpRankB) {
                    return $cpRankA <=> $cpRankB;
                }
            }

            // 4. Priority: Started vs Yet To Start
            // If both have no checkpoint data, Started should come before Yet To Start
            $isYetToStartA = $this->isYetToStartStatus($a->status);
            $isYetToStartB = $this->isYetToStartStatus($b->status);

            if ($isYetToStartA !== $isYetToStartB) {
                // Started (not YET TO START) comes first
                return $isYetToStartA ? 1 : -1;
            }

            // 5. Fallback: Sort by BIB
            // This also handles the case where race hasn't started (lastCpIndex = -1 for all)
            return strnatcmp($a->bib, $b->bib);
        })
            ->values();

        // Recalculate overallRank for finished participants based on sorted position (by finish time)
        $finishedRank = 1;
        $mapped = $mapped->map(function (ParticipantData $p) use (&$finishedRank) {
            if ($this->isFinishedStatus($p->status) && ! $this->isDnfOrDnsStatus($p->status)) {
                // Create new ParticipantData with recalculated rank
                return new ParticipantData(
                    overallRank: $finishedRank++,
                    genderRank: $p->genderRank, // Keep original for now
                    bib: $p->bib,
                    name: $p->name,
                    gender: $p->gender,
                    nation: $p->nation,
                    club: $p->club,
                    finishTime: $p->finishTime,
                    netTime: $p->netTime,
                    gap: $p->gap,
                    status: $p->status,
                    checkpoints: $p->checkpoints,
                    isCot: $p->isCot,
                );
            }

            return $p;
        });

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
                    distance: isset($cp['distance']) ? (float) $cp['distance'] : null,
                    elevationGain: isset($cp['elevationGain']) ? (float) $cp['elevationGain'] : null,
                ),
                $payload['checkpoints'] ?? []
            ),
            isCot: (bool) ($payload['isCot'] ?? false),
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
