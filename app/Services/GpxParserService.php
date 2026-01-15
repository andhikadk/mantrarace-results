<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class GpxParserService
{
    /**
     * Parse GPX file and extract elevation profile data with waypoints
     *
     * @param  string  $gpxPath  Path relative to storage
     * @return array{elevation: array, waypoints: array}
     */
    public function parse(string $gpxPath): array
    {
        $fullPath = Storage::disk('public')->path($gpxPath);

        if (! file_exists($fullPath)) {
            return ['elevation' => [], 'waypoints' => []];
        }

        $xml = simplexml_load_file($fullPath);
        if ($xml === false) {
            return ['elevation' => [], 'waypoints' => []];
        }

        // Register GPX namespace
        $xml->registerXPathNamespace('gpx', 'http://www.topografix.com/GPX/1/1');

        // 1. Parse FULL track points (no sampling)
        $fullTrackData = $this->parseTrackPoints($xml);

        // 2. Parse waypoints matched against FULL track data
        $waypoints = $this->parseWaypoints($xml, $fullTrackData);

        // 3. Sample track data for chart visualization (max 200 points)
        $sampledElevation = $this->sampleDataPoints($fullTrackData, 200);

        return [
            'elevation' => $sampledElevation,
            'waypoints' => $waypoints,
        ];
    }

    /**
     * Legacy method for backward compatibility
     */
    public function parseElevation(string $gpxPath): array
    {
        $result = $this->parse($gpxPath);

        return $result['elevation'];
    }

    private function parseTrackPoints(\SimpleXMLElement $xml): array
    {
        // Try to find track points
        $points = $xml->xpath('//gpx:trkpt') ?: $xml->xpath('//trkpt') ?: [];

        if (empty($points)) {
            // Try route points as fallback
            $points = $xml->xpath('//gpx:rtept') ?: $xml->xpath('//rtept') ?: [];
        }

        if (empty($points)) {
            return [];
        }

        $elevationData = [];
        $totalDistance = 0;
        $prevLat = null;
        $prevLon = null;

        foreach ($points as $point) {
            $lat = (float) $point['lat'];
            $lon = (float) $point['lon'];
            $ele = (float) ($point->ele ?? 0);

            if ($prevLat !== null && $prevLon !== null) {
                $distance = $this->haversineDistance($prevLat, $prevLon, $lat, $lon);
                $totalDistance += $distance;
            }

            $elevationData[] = [
                'distance' => round($totalDistance, 2),
                'elevation' => round($ele, 1),
                'lat' => $lat,
                'lon' => $lon,
            ];

            $prevLat = $lat;
            $prevLon = $lon;
        }

        return $elevationData;
    }

    private function parseWaypoints(\SimpleXMLElement $xml, array $fullTrackData): array
    {
        // Try to find waypoints
        $wpts = $xml->xpath('//gpx:wpt') ?: $xml->xpath('//wpt') ?: [];

        if (empty($wpts) || empty($fullTrackData)) {
            return [];
        }

        $waypoints = [];

        foreach ($wpts as $wpt) {
            $lat = (float) $wpt['lat'];
            $lon = (float) $wpt['lon'];
            $name = (string) ($wpt->name ?? 'Checkpoint');
            $ele = (float) ($wpt->ele ?? 0);

            // Find closest elevation point available in FULL track data
            $closestDistance = $this->findClosestDistance($lat, $lon, $fullTrackData);

            // Only add if reasonable close (< 1km like in HTML logic)
            // But for now purely closest to mimic simple logic

            $waypoints[] = [
                'name' => $name,
                'distance' => $closestDistance,
                'elevation' => round($ele, 1),
            ];
        }

        // Sort by distance for ordered display
        usort($waypoints, fn ($a, $b) => $a['distance'] <=> $b['distance']);

        return $waypoints;
    }

    private function findClosestDistance(float $lat, float $lon, array $elevationData): float
    {
        $minDist = PHP_FLOAT_MAX;
        $closestDistance = 0;

        foreach ($elevationData as $point) {
            $dist = $this->haversineDistance($lat, $lon, $point['lat'], $point['lon']);
            if ($dist < $minDist) {
                $minDist = $dist;
                $closestDistance = $point['distance'];
            }
        }

        return $closestDistance;
    }

    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     *
     * @return float Distance in kilometers
     */
    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Sample data points to reduce chart load
     */
    private function sampleDataPoints(array $data, int $maxPoints): array
    {
        $count = count($data);
        if ($count <= $maxPoints) {
            return $data;
        }

        $step = $count / $maxPoints;
        $sampled = [];

        for ($i = 0; $i < $maxPoints; $i++) {
            $index = (int) floor($i * $step);
            $sampled[] = $data[$index];
        }

        // Always include the last point
        $sampled[] = $data[$count - 1];

        return $sampled;
    }
}
