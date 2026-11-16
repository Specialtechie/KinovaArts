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
        'desired_timeline',
        'reference_image_1',
        'reference_image_2',
        'reference_image_3',
        'status',
        'quoted_price',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return ['quoted_price' => 'decimal:2'];
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

    public function depositAmount(): float
    {
        return round((float) $this->quoted_price * 0.7, 2);
    }

    public function balanceAmount(): float
    {
        return round((float) $this->quoted_price - $this->depositAmount(), 2);
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

    private function hasPaidOrderOfType(string $type): bool
    {
        return $this->orders()
            ->where('payment_type', $type)
            ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->exists();
    }
}
