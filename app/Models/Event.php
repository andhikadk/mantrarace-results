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
            // certificate_availability_date kept as string to avoid timezone conversion
        ];
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
