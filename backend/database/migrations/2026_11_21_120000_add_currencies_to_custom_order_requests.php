<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('custom_order_requests', function (Blueprint $table) {
            $table->string('budget_currency', 3)->default('USD');
            $table->string('quoted_currency', 3)->default('USD');
        });
    }

    public function down(): void
    {
        Schema::table('custom_order_requests', function (Blueprint $table) {
            $table->dropColumn(['budget_currency', 'quoted_currency']);
        });
    }
};
