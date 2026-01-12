<?php

namespace App\Contracts;

interface TimingSystemInterface
{
    /**
     * Fetch results from timing system API
     *
     * @return array<int, array<string, mixed>>
     */
    public function fetchResults(string $endpointUrl): array;
}
