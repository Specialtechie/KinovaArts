<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\PaymentFulfilment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaystackWebhookController extends Controller
{
    /** Backup path: confirms payment even if the customer closes the tab before the redirect back. */
    public function handle(Request $request, PaymentFulfilment $fulfilment)
    {
        $signature = $request->header('x-paystack-signature');
        $computed = hash_hmac('sha512', $request->getContent(), (string) config('services.paystack.secret'));

        if (! $signature || ! hash_equals($computed, $signature)) {
            Log::warning('Paystack webhook signature verification failed');

            return response()->json(['error' => 'Invalid signature'], 400);
        }

        if ($request->input('event') === 'charge.success') {
            $reference = $request->input('data.reference');
            $order = $reference ? Order::where('order_number', $reference)->first() : null;

            if ($order) {
                $fulfilment->markPaid($order);
            }
        }

        return response()->json(['received' => true]);
    }
}
