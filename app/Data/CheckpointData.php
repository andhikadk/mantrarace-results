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
    ) {}

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'time' => $this->time,
            'segment' => $this->segment,
            'overall_rank' => $this->overallRank,
            'gender_rank' => $this->genderRank,
        ];
    }
}
