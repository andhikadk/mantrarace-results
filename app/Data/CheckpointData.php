<?php

namespace App\Data;

readonly class CheckpointData
{
    public function __construct(
        public string $name,
        public ?string $time,
        public ?string $segment,
        public ?int $overallRank,
        public ?int $genderRank,
        public ?float $distance = null,
        public ?float $elevationGain = null,
    ) {}

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'time' => $this->time,
            'segment' => $this->segment,
            'overallRank' => $this->overallRank,
            'genderRank' => $this->genderRank,
            'distance' => $this->distance,
            'elevationGain' => $this->elevationGain,
        ];
    }
}
