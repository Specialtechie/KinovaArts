<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomOrderRequest extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'name',
        'email',
        'phone',
        'description',
        'category_preference',
        'material_preference',
        'color_preference',
        'dimensions',
        'budget_range',
        'budget_currency',
        'desired_timeline',
        'reference_image_1',
        'reference_image_2',
        'reference_image_3',
        'status',
        'quoted_price',
        'quoted_currency',
        'delivery_fee',
        'admin_notes',
        'shipping_name',
        'shipping_line1',
        'shipping_line2',
        'shipping_city',
        'shipping_state',
        'shipping_country',
        'shipping_postcode',
        'completion_details',
        'completion_images',
    ];

    protected function casts(): array
    {
        return [
            'quoted_price' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'completion_images' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(OrderMessage::class)->orderBy('created_at');
    }

    public function referenceImages(): array
    {
        return array_filter([
            $this->reference_image_1,
            $this->reference_image_2,
            $this->reference_image_3,
        ]);
    }

    public function requiresInstallment(): bool
    {
        return (float) $this->quoted_price > 0;
    }

    public function totalQuoteAmount(): float
    {
        return round((float) $this->quoted_price + (float) $this->delivery_fee, 2);
    }

    public function depositAmount(): float
    {
        return round((float) $this->quoted_price * 0.7, 2);
    }

    public function balanceAmount(): float
    {
        return round($this->totalQuoteAmount() - $this->depositAmount(), 2);
    }

    public function paymentAmount(string $type): float
    {
        return match ($type) {
            'deposit' => $this->depositAmount(),
            'balance' => $this->balanceAmount(),
            default => $this->totalQuoteAmount(),
        };
    }

    public function isDepositPaid(): bool
    {
        return $this->hasPaidOrderOfType('deposit');
    }

    public function isBalancePaid(): bool
    {
        return $this->hasPaidOrderOfType('balance');
    }

    public function isFullyPaid(): bool
    {
        return $this->hasPaidOrderOfType('full')
            || ($this->isDepositPaid() && $this->isBalancePaid());
    }

    public function hasPendingOrderOfType(string $type): bool
    {
        return $this->orders()
            ->where('payment_type', $type)
            ->where('status', 'pending')
            ->exists();
    }

    private function hasPaidOrderOfType(string $type): bool
    {
        return $this->orders()
            ->where('payment_type', $type)
            ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->exists();
    }
}
