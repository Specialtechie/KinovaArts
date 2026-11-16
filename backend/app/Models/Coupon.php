<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = ['code', 'percent_off', 'amount_off', 'min_order_total', 'expires_at', 'active'];

    protected function casts(): array
    {
        return [
            'percent_off' => 'integer',
            'amount_off' => 'decimal:2',
            'min_order_total' => 'decimal:2',
            'expires_at' => 'datetime',
            'active' => 'boolean',
        ];
    }

    public function calculateDiscount(float $subtotal): ?float
    {
        if (! $this->active
            || ($this->expires_at && $this->expires_at->isPast())
            || ($this->min_order_total !== null && $subtotal < (float) $this->min_order_total)) {
            return null;
        }

        $discount = $this->percent_off !== null
            ? $subtotal * $this->percent_off / 100
            : (float) $this->amount_off;

        return round(min($subtotal, $discount), 2);
    }
}
