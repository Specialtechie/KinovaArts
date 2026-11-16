<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Product;

class CartPricing
{
    /** The cart lives in the browser; this prices it from the database so the client is never trusted. */
    public function build(array $items, ?string $couponCode = null): array
    {
        $wanted = [];
        foreach ($items as $item) {
            $id = (int) $item['product_id'];
            $wanted[$id] = ($wanted[$id] ?? 0) + (int) $item['quantity'];
        }

        $products = Product::active()->with('featuredImage')->whereIn('id', array_keys($wanted))->get()->keyBy('id');

        $lines = [];
        $issues = [];
        $subtotal = 0.0;

        foreach ($wanted as $id => $quantity) {
            $product = $products->get($id);

            if (! $product) {
                $issues[] = 'A piece in your bag is no longer available.';
                continue;
            }

            if ($product->stock < $quantity) {
                $issues[] = $product->stock > 0
                    ? "{$product->name}: only {$product->stock} left in stock."
                    : "{$product->name} is out of stock.";
            }

            $price = $product->display_price;
            $imageUrl = $product->featuredImage?->url;

            $lines[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'image' => $imageUrl && str_starts_with($imageUrl, '/') ? url($imageUrl) : $imageUrl,
                'price' => $price,
                'quantity' => $quantity,
                'stock' => $product->stock,
                'line_total' => round($price * $quantity, 2),
            ];

            $subtotal += $price * $quantity;
        }

        $subtotal = round($subtotal, 2);
        $discount = 0.0;
        $appliedCode = null;
        $couponError = null;

        if ($couponCode) {
            $coupon = Coupon::where('code', strtoupper(trim($couponCode)))->first();
            $calculated = $coupon?->calculateDiscount($subtotal);

            if ($coupon && $calculated !== null) {
                $discount = $calculated;
                $appliedCode = $coupon->code;
            } else {
                $couponError = 'That coupon is not valid for this order.';
            }
        }

        $total = max(0, round($subtotal - $discount, 2));
        $rate = Paystack::rate();

        return [
            'lines' => $lines,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'coupon_code' => $appliedCode,
            'coupon_error' => $couponError,
            'total' => $total,
            'currency' => 'USD',
            'ngn_rate' => $rate,
            'ngn_total' => round($total * $rate, 2),
            'issues' => $issues,
        ];
    }
}
