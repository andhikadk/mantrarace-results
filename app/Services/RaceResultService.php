<?php

namespace App\Services;

use App\Contracts\TimingSystemInterface;
use App\Data\CheckpointData;
use App\Data\ParticipantData;
use App\Models\Category;
use App\Models\Checkpoint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

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
        $ttl = config('services.raceresult.cache_ttl', 60);

        $rawData = Cache::remember($cacheKey, $ttl, function () use ($category) {
            return $this->client->fetchResults($category->endpoint_url);
        });

        $checkpoints = $category->checkpoints;

        return collect($rawData)
            ->map(fn (array $row) => $this->mapParticipant($row, $checkpoints))
            ->sortBy('overallRank')
            ->values();
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
            overallRank: $cp->overall_rank_field ? ($row[$cp->overall_rank_field] ?? null) : null,
            genderRank: $cp->gender_rank_field ? ($row[$cp->gender_rank_field] ?? null) : null,
        ))->all();
    }

    /**
     * Normalize gender value (handle corrupted data like "F_ma_e")
     */
    private function normalizeGender(string $gender): string
    {
        $gender = strtolower(trim($gender));

        if (str_contains($gender, 'female') || str_contains($gender, 'f_ma')) {
            return 'Female';
        }

        return 'Male';
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
}
