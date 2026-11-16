<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index()
    {
        return response()->json(Coupon::orderBy('code')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code',
            'percent_off' => 'nullable|integer|min:1|max:100',
            'amount_off' => 'nullable|numeric|min:0',
            'min_order_total' => 'nullable|numeric|min:0',
            'expires_at' => 'nullable|date',
        ]);

        if (empty($data['percent_off']) && empty($data['amount_off'])) {
            return response()->json(['message' => 'Set either a percent-off or an amount-off value.'], 422);
        }

        $data['code'] = strtoupper($data['code']);

        return response()->json(Coupon::create($data), 201);
    }

    public function update(Request $request, Coupon $coupon)
    {
        $coupon->update($request->validate(['active' => 'required|boolean']));

        return response()->json($coupon);
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();

        return response()->json(['message' => 'Coupon deleted.']);
    }
}
