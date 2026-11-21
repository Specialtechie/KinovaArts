<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('delivery_fee_amount', 10, 2)->default(0);
            $table->string('delivery_fee_currency', 3)->default('USD');
            $table->decimal('delivery_fee_usd', 12, 2)->default(0);
            $table->decimal('delivery_fee_ngn', 12, 2)->default(0);
            $table->string('delivery_fee_status')->default('not_set')->index();
            $table->string('delivery_fee_reference')->nullable()->unique();
            $table->text('delivery_fee_authorization_url')->nullable();
            $table->timestamp('delivery_fee_paid_at')->nullable();
        });

        Schema::table('custom_order_requests', function (Blueprint $table) {
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->string('shipping_name')->nullable();
            $table->string('shipping_line1')->nullable();
            $table->string('shipping_line2')->nullable();
            $table->string('shipping_city')->nullable();
            $table->string('shipping_state')->nullable();
            $table->string('shipping_country')->nullable();
            $table->string('shipping_postcode', 50)->nullable();
            $table->longText('completion_details')->nullable();
            $table->json('completion_images')->nullable();
        });

        Schema::create('order_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('custom_order_request_id')->nullable()
                ->constrained('custom_order_requests')->cascadeOnDelete();
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->longText('body')->nullable();
            $table->json('images')->nullable();
            $table->timestamps();
            $table->index(['order_id', 'created_at']);
            $table->index(['custom_order_request_id', 'created_at'], 'order_messages_custom_order_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_messages');

        Schema::table('custom_order_requests', function (Blueprint $table) {
            $table->dropColumn([
                'delivery_fee',
                'shipping_name',
                'shipping_line1',
                'shipping_line2',
                'shipping_city',
                'shipping_state',
                'shipping_country',
                'shipping_postcode',
                'completion_details',
                'completion_images',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['delivery_fee_reference']);
            $table->dropIndex(['delivery_fee_status']);
            $table->dropColumn([
                'delivery_fee_amount',
                'delivery_fee_currency',
                'delivery_fee_usd',
                'delivery_fee_ngn',
                'delivery_fee_status',
                'delivery_fee_reference',
                'delivery_fee_authorization_url',
                'delivery_fee_paid_at',
            ]);
        });
    }
};
