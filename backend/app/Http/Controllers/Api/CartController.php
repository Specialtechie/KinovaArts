<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CartPricing;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /** Prices a browser-side cart (and optional coupon) from the database. No state is stored. */
    public function quote(Request $request, CartPricing $pricing)
    {
        $data = $request->validate([
            'items' => 'present|array|max:50',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1|max:99',
            'coupon_code' => 'nullable|string|max:50',
        ]);

        return response()->json($pricing->build($data['items'], $data['coupon_code'] ?? null));
    }
}
