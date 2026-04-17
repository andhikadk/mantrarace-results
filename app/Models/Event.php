<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $guarded = [];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'is_lap_based' => 'boolean',
            'is_cot_based' => 'boolean',
        ];
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
