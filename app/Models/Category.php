<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $guarded = [];

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
