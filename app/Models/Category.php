<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'total_distance' => 'float',
            'total_elevation_gain' => 'float',
            'start_time' => 'datetime',
            'cut_off_time' => 'datetime',
            'lap_stats_config' => 'array',
        ];
    }

    public function getLapStatsConfigAttribute($value): array
    {
        return $value ?? [
            'total_laps_field' => 'Laps',
            'best_lap_field' => 'BestLap',
            'avg_lap_field' => 'Avg.Lap',
            'current_cp_field' => 'CP',
            'cp_time_field' => 'CPmin',
            'segment_field' => 'Segment',
        ];
    }

    public function isLapBased(): bool
    {
        return $this->event->is_lap_based ?? false;
    }

    public function isCotBased(): bool
    {
        return $this->event->is_cot_based ?? false;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function checkpoints()
    {
        return $this->hasMany(Checkpoint::class)->orderBy('order_index');
    }

    public function certificate()
    {
        return $this->hasOne(Certificate::class);
    }
}
