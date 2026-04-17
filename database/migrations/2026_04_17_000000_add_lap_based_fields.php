<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->boolean('is_lap_based')->default(false)->after('location');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->json('lap_stats_config')->nullable()->after('cut_off_time');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('is_lap_based');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('lap_stats_config');
        });
    }
};
