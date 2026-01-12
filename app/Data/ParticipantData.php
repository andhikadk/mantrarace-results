<?php

namespace App\Data;

readonly class ParticipantData
{
    /**
     * @param  array<CheckpointData>  $checkpoints
     */
    public function __construct(
        public int $overallRank,
        public int $genderRank,
        public string $bib,
        public string $name,
        public string $gender,
        public string $nation,
        public string $club,
        public ?string $finishTime,
        public ?string $netTime,
        public ?string $gap,
        public string $status,
        public array $checkpoints,
    ) {}

    public function toArray(): array
    {
        return [
            'overall_rank' => $this->overallRank,
            'gender_rank' => $this->genderRank,
            'bib' => $this->bib,
            'name' => $this->name,
            'gender' => $this->gender,
            'nation' => $this->nation,
            'club' => $this->club,
            'finish_time' => $this->finishTime,
            'net_time' => $this->netTime,
            'gap' => $this->gap,
            'status' => $this->status,
            'checkpoints' => array_map(fn (CheckpointData $cp) => $cp->toArray(), $this->checkpoints),
        ];
    }
}
