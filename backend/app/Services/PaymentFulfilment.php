<?php

namespace App\Services;

use App\Mail\OrderConfirmationMail;
use App\Models\InventoryLog;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class PaymentFulfilment
{
    public static function newOrderNumber(string $prefix = 'KA-'): string
    {
        do {
            $number = $prefix.random_int(100000, 999999);
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }

    /**
     * Marks a pending order as paid. Idempotent, so it is safe to call from both the
     * verify endpoint and the Paystack webhook. Returns true only for the call that did the change.
     */
    public function markPaid(Order $order): bool
    {
        $transitioned = false;

        DB::transaction(function () use ($order, &$transitioned) {
            $locked = Order::with('items')->lockForUpdate()->find($order->id);

            if (! $locked || $locked->status !== 'pending') {
                return;
            }

            $locked->update(['status' => 'paid']);

            if ($locked->custom_order_request_id && in_array($locked->payment_type, ['full', 'deposit'], true)) {
                $locked->customOrderRequest?->update(['status' => 'accepted']);
            }

            foreach ($locked->items as $item) {
                $item->product()->decrement('stock', $item->quantity);
                InventoryLog::create([
                    'product_id' => $item->product_id,
                    'change' => -$item->quantity,
                    'reason' => 'sale',
                ]);
            }

            $transitioned = true;
        });

        if ($transitioned) {
            $this->sendConfirmation($order->fresh());
        }

        return $transitioned;
    }

    private function sendConfirmation(Order $order): void
    {
        $recipient = $order->recipientEmail();

        if (! $recipient) {
            return;
        }

        try {
            Mail::to($recipient)->send(new OrderConfirmationMail($order->load('items')));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
