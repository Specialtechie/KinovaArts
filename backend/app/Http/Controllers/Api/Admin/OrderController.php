<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryLog;
use App\Mail\OrderDeliveryFeeMail;
use App\Mail\OrderStatusUpdatedMail;
use App\Models\Order;
use App\Services\ExchangeRates;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::with('items')
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('q'), function ($q, $search) {
                $q->where(fn ($q) => $q->where('order_number', 'like', "%{$search}%")->orWhere('shipping_name', 'like', "%{$search}%"));
            })
            ->latest()
            ->paginate(min(max((int) $request->query('per_page', 25), 1), 100));

        return response()->json($orders);
    }

    public function show(Order $order)
    {
        return response()->json($order->load([
            'items',
            'user:id,name,email',
            'customOrderRequest',
            'messages.sender:id,name,is_admin',
        ]));
    }

    public function update(Request $request, Order $order, ExchangeRates $exchangeRates)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,paid,processing,shipped,delivered,cancelled,refunded',
            'courier' => 'nullable|string|max:255',
            'tracking_number' => 'nullable|string|max:255',
            'delivery_fee_amount' => 'sometimes|required|numeric|min:0',
            'delivery_fee_currency' => ['sometimes', 'required', 'string', 'size:3', 'regex:/^[A-Z]{3}$/'],
        ]);

        $previous = $order->status;
        $statusChanged = $previous !== $data['status'];
        $updates = array_intersect_key($data, array_flip(['status', 'courier', 'tracking_number']));
        $deliveryFeeChanged = false;

        if (
            in_array($previous, ['delivered', 'cancelled', 'refunded'], true)
            && $data['status'] !== $previous
        ) {
            return response()->json([
                'message' => 'Delivered, cancelled, and refunded orders are final and cannot change status.',
                'errors' => ['status' => ['This order status is final.']],
            ], 422);
        }

        if (
            $data['status'] === 'delivered'
            && (float) $order->delivery_fee_amount > 0
            && $order->delivery_fee_status !== 'paid'
        ) {
            return response()->json([
                'message' => 'Collect the delivery fee before marking this order as delivered.',
                'errors' => ['status' => ['The delivery fee must be paid before delivery is complete.']],
            ], 422);
        }

        if (
            in_array($data['status'], ['cancelled', 'refunded'], true)
            && in_array($order->delivery_fee_status, ['initializing', 'pending'], true)
        ) {
            return response()->json([
                'message' => 'The delivery-fee payment is already in progress. Confirm its outcome before cancelling or refunding the order.',
                'errors' => ['status' => ['The delivery-fee payment is in progress.']],
            ], 422);
        }

        if (array_key_exists('delivery_fee_amount', $data) || array_key_exists('delivery_fee_currency', $data)) {
            $amount = (float) ($data['delivery_fee_amount'] ?? $order->delivery_fee_amount);
            $currency = $data['delivery_fee_currency'] ?? $order->delivery_fee_currency;
            $deliveryFeeChanged = $amount !== (float) $order->delivery_fee_amount
                || ($amount > 0 && $currency !== $order->delivery_fee_currency);

            if ($deliveryFeeChanged && $order->custom_order_request_id) {
                return response()->json([
                    'message' => 'Set delivery fees on the custom-order request, not on its payment order.',
                    'errors' => ['delivery_fee_amount' => ['Set delivery fees on the custom-order request.']],
                ], 422);
            }

            if (
                in_array($data['status'], ['cancelled', 'refunded'], true)
                && $order->delivery_fee_status === 'unpaid'
            ) {
                $updates['delivery_fee_status'] = 'cancelled';
                $updates['delivery_fee_reference'] = null;
                $updates['delivery_fee_authorization_url'] = null;
            }

            if ($deliveryFeeChanged && in_array($data['status'], ['cancelled', 'refunded', 'delivered'], true)) {
                return response()->json([
                    'message' => 'A delivery fee must be set before the order is delivered, cancelled, or refunded.',
                    'errors' => ['delivery_fee_amount' => ['This order is no longer eligible for a delivery fee.']],
                ], 422);
            }

            if ($deliveryFeeChanged && $amount > 0 && $order->status === 'pending') {
                return response()->json([
                    'message' => 'Set the delivery fee after the customer has paid for the order.',
                    'errors' => ['delivery_fee_amount' => ['The order payment is still pending.']],
                ], 422);
            }

            if ($deliveryFeeChanged && in_array($order->delivery_fee_status, ['initializing', 'pending', 'paid'], true)) {
                return response()->json([
                    'message' => 'A delivery fee cannot be changed while its payment is pending or after it has been paid.',
                    'errors' => ['delivery_fee_amount' => ['The delivery-fee payment is already in progress or complete.']],
                ], 422);
            }

            if ($deliveryFeeChanged && $amount > 0) {
                try {
                    $updates['delivery_fee_usd'] = $exchangeRates->convert($amount, $currency, 'USD');
                    $updates['delivery_fee_ngn'] = $exchangeRates->convert($amount, $currency, 'NGN');
                } catch (RuntimeException $exception) {
                    report($exception);

                    return response()->json(['message' => 'The delivery-fee currency cannot be converted right now. Please try again later.'], 503);
                }

                $updates['delivery_fee_amount'] = $amount;
                $updates['delivery_fee_currency'] = $currency;
                $updates['delivery_fee_status'] = 'unpaid';
            } elseif ($deliveryFeeChanged) {
                $updates['delivery_fee_amount'] = 0;
                $updates['delivery_fee_usd'] = 0;
                $updates['delivery_fee_ngn'] = 0;
                $updates['delivery_fee_currency'] = $currency;
                $updates['delivery_fee_status'] = 'not_set';
                $updates['delivery_fee_reference'] = null;
                $updates['delivery_fee_authorization_url'] = null;
            }
        }

        $order->update($updates);

        // Stock is only taken at payment, so only paid-through orders are restocked, and only once.
        $consumed = ['paid', 'processing', 'shipped', 'delivered'];

        if (in_array($data['status'], ['cancelled', 'refunded'], true) && in_array($previous, $consumed, true)) {
            foreach ($order->items as $item) {
                $item->product()->increment('stock', $item->quantity);
                InventoryLog::create([
                    'product_id' => $item->product_id,
                    'change' => $item->quantity,
                    'reason' => 'return',
                ]);
            }
        }

        $order->refresh();

        if ($statusChanged && $order->recipientEmail()) {
            try {
                Mail::to($order->recipientEmail())->send(new OrderStatusUpdatedMail($order));
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        if ($deliveryFeeChanged && $order->recipientEmail()) {
            try {
                Mail::to($order->recipientEmail())->send(new OrderDeliveryFeeMail($order));
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return response()->json($order->load('items'));
    }
}
