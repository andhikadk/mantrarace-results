<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryResult extends Model
{
    protected $table = 'category_results';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'participants' => 'array',
            'fetched_at' => 'datetime',
            'locked_at' => 'datetime',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function isLocked(): bool
    {
        return $this->locked_at !== null;
    }

    public function lock(): self
    {
        $this->update(['locked_at' => now()]);

        return $this;
    }

    public function unlock(): self
    {
        $this->update(['locked_at' => null]);

        return $this;
    }
}
