<?php

namespace App\Services;

use App\Contracts\TimingSystemInterface;
use App\Data\CheckpointData;
use App\Data\ParticipantData;
use App\Models\Category;
use App\Models\Checkpoint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RaceResultService
{
    public function __construct(
        private TimingSystemInterface $client,
    ) {}

    /**
     * Get leaderboard for a category
     *
     * @return Collection<int, ParticipantData>
     */
    public function getLeaderboard(Category $category): Collection
    {
        $cacheKey = "raceresult:{$category->id}";
        $ttl = 5;

        $start = microtime(true);
        $cacheHit = Cache::has($cacheKey);

        $rawData = Cache::remember($cacheKey, $ttl, function () use ($category) {
            return $this->client->fetchResults($category->endpoint_url);
        });

        Log::info('raceresult.fetch', [
            'category_id' => $category->id,
            'cache_hit' => $cacheHit,
            'count' => count($rawData),
            'ms' => (microtime(true) - $start) * 1000,
        ]);

        $checkpoints = $category->checkpoints;

        $mapStart = microtime(true);
        $mapped = collect($rawData)
            ->map(fn (array $row) => $this->mapParticipant($row, $checkpoints))
            ->sort(function (ParticipantData $a, ParticipantData $b) {
                $rankA = $a->overallRank > 0 ? $a->overallRank : PHP_INT_MAX;
                $rankB = $b->overallRank > 0 ? $b->overallRank : PHP_INT_MAX;

                if ($rankA === $rankB) {
                    return strnatcmp($a->bib, $b->bib);
                }

                return $rankA <=> $rankB;
            })
            ->values();
        Log::info('raceresult.map', [
            'category_id' => $category->id,
            'ms' => (microtime(true) - $mapStart) * 1000,
        ]);

        return $mapped;
    }

    /**
     * Get single participant by BIB
     */
    public function getParticipant(Category $category, string $bib): ?ParticipantData
    {
        return $this->getLeaderboard($category)
            ->first(fn (ParticipantData $p) => $p->bib === $bib);
    }

    /**
     * Map raw API data to ParticipantData
     *
     * @param  Collection<int, Checkpoint>  $checkpoints
     */
    private function mapParticipant(array $row, Collection $checkpoints): ParticipantData
    {
        return new ParticipantData(
            overallRank: (int) ($row['Overall Rank'] ?? 0),
            genderRank: (int) ($row['Gender Rank'] ?? 0),
            bib: (string) ($row['BIB'] ?? ''),
            name: $this->cleanName($row['Name'] ?? ''),
            gender: $this->normalizeGender($row['GENDER'] ?? ''),
            nation: $row['Nation'] ?? '',
            club: $row['Club'] ?? '',
            finishTime: $this->cleanTimeValue($row['Finish Time'] ?? null),
            netTime: $this->cleanTimeValue($row['NetTime'] ?? null),
            gap: $row['Gap'] ?? null,
            status: $row['Status'] ?? '',
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
}
