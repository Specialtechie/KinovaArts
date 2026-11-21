<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Paystack;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

class OrderDeliveryFeeController extends Controller
{
    public function pay(Request $request, Order $order, Paystack $paystack)
    {
        abort_unless($order->user_id === $request->user()->id, 404);
        abort_unless(! $order->custom_order_request_id, 422, 'Custom-order delivery fees are included in the remaining balance.');
        abort_unless(in_array($order->status, ['paid', 'processing', 'shipped'], true), 422, 'The original order must be paid and not yet delivered before its delivery fee can be collected.');

        if ($order->delivery_fee_status === 'pending' && $order->delivery_fee_authorization_url) {
            return response()->json(['authorization_url' => $order->delivery_fee_authorization_url]);
        }

        if ($order->delivery_fee_status === 'initializing') {
            return response()->json(['message' => 'The payment is being prepared. Please try again shortly.'], 409);
        }

        abort_unless($order->delivery_fee_status === 'unpaid' && (float) $order->delivery_fee_ngn > 0, 422, 'There is no unpaid delivery fee for this order.');

        $reference = 'KA-DF-'.$order->id.'-'.Str::upper(Str::random(12));
        $order->update([
            'delivery_fee_status' => 'initializing',
            'delivery_fee_reference' => $reference,
        ]);

        try {
            $url = $paystack->initializeInNgn(
                $request->user()->email,
                (float) $order->delivery_fee_ngn,
                $reference,
                ['order_id' => $order->id, 'payment_type' => 'delivery_fee'],
            );
        } catch (RuntimeException $exception) {
            $order->update([
                'delivery_fee_status' => 'unpaid',
                'delivery_fee_reference' => null,
            ]);

            return response()->json(['message' => $exception->getMessage()], 502);
        }

        $order->update([
            'delivery_fee_status' => 'pending',
            'delivery_fee_authorization_url' => $url,
        ]);

        return response()->json(['authorization_url' => $url], 201);
    }
}
