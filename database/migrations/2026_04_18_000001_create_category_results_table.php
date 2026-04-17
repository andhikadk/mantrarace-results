<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('participants');
            $table->unsignedInteger('total_participants')->default(0);
            $table->timestamp('fetched_at');
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();

            $table->index('locked_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_results');
    }
};
