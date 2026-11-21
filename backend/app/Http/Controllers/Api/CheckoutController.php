<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\CartPricing;
use App\Services\PaymentFulfilment;
use App\Services\Paystack;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CheckoutController extends Controller
{
    public function store(Request $request, CartPricing $pricing, Paystack $paystack)
    {
        $data = $request->validate([
            'items' => 'required|array|min:1|max:50',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1|max:99',
            'coupon_code' => 'nullable|string|max:50',
            'name' => 'required|string|max:255',
            'line1' => 'required|string|max:255',
            'line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'required|string|max:255',
            'postcode' => 'required|string|max:50',
        ]);

        $quote = $pricing->build($data['items'], $data['coupon_code'] ?? null);

        if (empty($quote['lines']) || ! empty($quote['issues'])) {
            return response()->json([
                'message' => $quote['issues'][0] ?? 'Your bag is empty.',
                'issues' => $quote['issues'],
            ], 422);
        }

        // Never let someone pay a different price than the one they saw.
        if (! empty($data['coupon_code']) && $quote['coupon_error']) {
            return response()->json(['message' => $quote['coupon_error']], 422);
        }

        $user = $request->user();

        $order = DB::transaction(function () use ($data, $quote, $user) {
            $order = Order::create([
                'order_number' => PaymentFulfilment::newOrderNumber('KA-'),
                'user_id' => $user->id,
                'status' => 'pending',
                'subtotal' => $quote['subtotal'],
                'discount' => $quote['discount'],
                'total' => $quote['total'],
                'coupon_code' => $quote['coupon_code'],
                'shipping_name' => $data['name'],
                'shipping_line1' => $data['line1'],
                'shipping_line2' => $data['line2'] ?? null,
                'shipping_city' => $data['city'],
                'shipping_state' => $data['state'] ?? null,
                'shipping_country' => $data['country'],
                'shipping_postcode' => $data['postcode'],
            ]);

            foreach ($quote['lines'] as $line) {
                $order->items()->create([
                    'product_id' => $line['product_id'],
                    'name_snapshot' => $line['name'],
                    'price_snapshot' => $line['price'],
                    'quantity' => $line['quantity'],
                ]);
            }

            return $order;
        });

        try {
            $url = $paystack->initialize($user->email, $quote['total'], $order->order_number, [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ]);
        } catch (RuntimeException $e) {
            $order->update(['status' => 'cancelled']);

            return response()->json(['message' => $e->getMessage()], 502);
        }

        $order->update(['paystack_reference' => $order->order_number]);

        return response()->json([
            'order_number' => $order->order_number,
            'authorization_url' => $url,
        ], 201);
    }

    /** Called by the frontend's /checkout/success page after Paystack redirects the customer back. */
    public function verify(Request $request, Paystack $paystack, PaymentFulfilment $fulfilment)
    {
        $reference = $request->query('reference') ?? $request->query('trxref');

        if (! $reference) {
            return response()->json(['message' => 'Missing payment reference.'], 422);
        }

        $order = Order::where('order_number', $reference)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($order->status === 'pending') {
            $paid = $paystack->isPaid($reference);

            if ($paid === null) {
                return response()->json(['message' => 'Could not reach the payment provider. Please refresh in a moment.'], 502);
            }

            if ($paid) {
                $fulfilment->markPaid($order);
                $order->refresh();
            }
        }

        return response()->json([
            'order_number' => $order->order_number,
            'status' => $order->status,
            'total' => $order->total,
            'payment_type' => $order->payment_type ?? 'full',
            'custom_order_request_id' => $order->custom_order_request_id,
            'custom_order_payment' => $order->customOrderPayment(),
        ]);
    }
}
