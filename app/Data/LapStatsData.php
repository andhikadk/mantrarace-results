<?php

namespace App\Data;

readonly class LapStatsData
{
    public function __construct(
        public ?string $totalLaps = null,
        public ?string $bestLap = null,
        public ?string $avgLap = null,
        public ?string $currentCp = null,
        public ?string $cpTime = null,
        public ?string $segment = null,
    ) {}

    public function toArray(): array
    {
        return [
            'totalLaps' => $this->totalLaps,
            'bestLap' => $this->bestLap,
            'avgLap' => $this->avgLap,
            'currentCp' => $this->currentCp,
            'cpTime' => $this->cpTime,
            'segment' => $this->segment,
        ];
    }
}
