<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'paystack_reference',
        'user_id',
        'custom_order_request_id',
        'payment_type',
        'status',
        'subtotal',
        'discount',
        'total',
        'coupon_code',
        'shipping_name',
        'shipping_line1',
        'shipping_line2',
        'shipping_city',
        'shipping_state',
        'shipping_country',
        'shipping_postcode',
        'courier',
        'tracking_number',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customOrderRequest(): BelongsTo
    {
        return $this->belongsTo(CustomOrderRequest::class);
    }

    public function recipientEmail(): ?string
    {
        return $this->user?->email ?? $this->customOrderRequest?->email;
    }
}
