<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $hidden = ['delivery_fee_authorization_url'];

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
        'delivery_fee_amount',
        'delivery_fee_currency',
        'delivery_fee_usd',
        'delivery_fee_ngn',
        'delivery_fee_status',
        'delivery_fee_reference',
        'delivery_fee_authorization_url',
        'delivery_fee_paid_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'delivery_fee_amount' => 'decimal:2',
            'delivery_fee_usd' => 'decimal:2',
            'delivery_fee_ngn' => 'decimal:2',
            'delivery_fee_paid_at' => 'datetime',
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

    public function messages(): HasMany
    {
        return $this->hasMany(OrderMessage::class)->orderBy('created_at');
    }

    public function recipientEmail(): ?string
    {
        return $this->user?->email ?? $this->customOrderRequest?->email;
    }

    public function customOrderPayment(): ?array
    {
        $customOrder = $this->customOrderRequest;

        if (! $customOrder) {
            return null;
        }

        return [
            'amount' => $customOrder->paymentAmount($this->payment_type ?: 'full'),
            'currency' => $customOrder->quoted_currency ?: 'USD',
        ];
    }
}
