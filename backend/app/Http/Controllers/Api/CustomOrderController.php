<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\CustomOrderReceivedMail;
use App\Models\CustomOrderRequest;
use App\Models\Order;
use App\Services\ExchangeRates;
use App\Services\PaymentFulfilment;
use App\Services\Paystack;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class CustomOrderController extends Controller
{
    /** Open to guests too; if a bearer token is sent, the request is linked to that account. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'product_id' => 'nullable|integer|exists:products,id',
            'description' => 'required|string|min:20|max:5000',
            'category_preference' => 'nullable|string|max:255',
            'material_preference' => 'nullable|string|max:255',
            'color_preference' => 'nullable|string|max:255',
            'dimensions' => 'nullable|string|max:255',
            'budget_range' => 'nullable|string|max:255',
            'budget_currency' => ['nullable', 'string', 'size:3', 'regex:/^[A-Z]{3}$/'],
            'desired_timeline' => 'nullable|string|max:255',
            'images' => 'nullable|array|max:3',
            'images.*' => 'image|max:8192',
        ]);

        $urls = [];
        foreach ($request->file('images', []) as $file) {
            $urls[] = Storage::disk('public')->url($file->store('custom-orders', 'public'));
        }

        $customOrder = CustomOrderRequest::create([
            'user_id' => $request->user('sanctum')?->id,
            'product_id' => $data['product_id'] ?? null,
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'] ?? null,
            'description' => $data['description'],
            'category_preference' => $data['category_preference'] ?? null,
            'material_preference' => $data['material_preference'] ?? null,
            'color_preference' => $data['color_preference'] ?? null,
            'dimensions' => $data['dimensions'] ?? null,
            'budget_range' => $data['budget_range'] ?? null,
            'budget_currency' => $data['budget_currency'] ?? 'USD',
            'desired_timeline' => $data['desired_timeline'] ?? null,
            'reference_image_1' => $urls[0] ?? null,
            'reference_image_2' => $urls[1] ?? null,
            'reference_image_3' => $urls[2] ?? null,
        ]);

        $adminEmail = config('services.admin_notify_email') ?: config('mail.from.address');

        if ($adminEmail) {
            try {
                Mail::to($adminEmail)->send(new CustomOrderReceivedMail($customOrder));
            } catch (\Throwable $e) {
                report($e); // the request is saved; a mail failure must not lose it
            }
        }

        return response()->json(['id' => $customOrder->id, 'status' => $customOrder->status], 201);
    }

    public function mine(Request $request)
    {
        $user = $request->user();

        $requests = CustomOrderRequest::where(fn ($q) => $q->where('user_id', $user->id)->orWhere('email', $user->email))
            ->with(['product', 'orders'])
            ->latest()
            ->get()
            ->map(fn ($r) => $this->present($r))
            ->values();

        return response()->json($requests);
    }

    public function show(Request $request, CustomOrderRequest $customOrder)
    {
        $this->authorizeOwner($request, $customOrder);

        return response()->json($this->present($customOrder->load(['product', 'orders'])));
    }

    public function pay(Request $request, CustomOrderRequest $customOrder, string $type, Paystack $paystack, ExchangeRates $exchangeRates)
    {
        $this->authorizeOwner($request, $customOrder);

        $amount = $this->amountFor($customOrder, $type);
        $quotedCurrency = $customOrder->quoted_currency ?: 'USD';

        try {
            $amountInUsd = $exchangeRates->convert($amount, $quotedCurrency, 'USD');
            $amountInNgn = $exchangeRates->convert($amount, $quotedCurrency, 'NGN');
        } catch (RuntimeException $exception) {
            report($exception);

            return response()->json(['message' => 'The quote currency cannot be converted right now. Please try again later.'], 503);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'line1' => 'required|string|max:255',
            'line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'required|string|max:255',
            'postcode' => 'required|string|max:50',
        ]);

        $prefix = match ($type) {
            'deposit' => 'KA-CO-D-',
            'balance' => 'KA-CO-B-',
            default => 'KA-CO-F-',
        };

        $order = Order::create([
            'order_number' => PaymentFulfilment::newOrderNumber($prefix),
            'user_id' => $request->user()->id,
            'custom_order_request_id' => $customOrder->id,
            'payment_type' => $type,
            'status' => 'pending',
            'subtotal' => $amountInUsd,
            'total' => $amountInUsd,
            'shipping_name' => $data['name'],
            'shipping_line1' => $data['line1'],
            'shipping_line2' => $data['line2'] ?? null,
            'shipping_city' => $data['city'],
            'shipping_state' => $data['state'] ?? null,
            'shipping_country' => $data['country'],
            'shipping_postcode' => $data['postcode'],
        ]);

        try {
            $url = $paystack->initializeInNgn($request->user()->email, $amountInNgn, $order->order_number, [
                'order_id' => $order->id,
                'custom_order_request_id' => $customOrder->id,
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

    private function authorizeOwner(Request $request, CustomOrderRequest $customOrder): void
    {
        $user = $request->user();

        abort_unless($customOrder->user_id === $user->id || $customOrder->email === $user->email, 404);
    }

    private function amountFor(CustomOrderRequest $r, string $type): float
    {
        abort_unless((float) $r->quoted_price > 0 && $r->status !== 'declined', 422, 'This request has no payable quote.');

        if ($type === 'full') {
            abort_if($r->requiresInstallment(), 422, 'This quote is paid as a deposit and a balance.');
            abort_if($r->isFullyPaid(), 422, 'This quote is already paid.');

            return (float) $r->quoted_price;
        }

        abort_unless($r->requiresInstallment(), 422, 'This quote is not paid in instalments.');

        if ($type === 'deposit') {
            abort_if($r->isDepositPaid(), 422, 'The deposit is already paid.');

            return $r->depositAmount();
        }

        abort_unless($r->isDepositPaid(), 422, 'Pay the deposit first.');
        abort_unless($r->status === 'completed', 422, 'The balance is due once your piece is ready.');
        abort_if($r->isBalancePaid(), 422, 'The balance is already paid.');

        return $r->balanceAmount();
    }

    private function nextPayment(CustomOrderRequest $r): ?string
    {
        if ((float) $r->quoted_price <= 0 || $r->status === 'declined' || $r->isFullyPaid()) {
            return null;
        }

        if (! $r->requiresInstallment()) {
            return 'full';
        }

        if (! $r->isDepositPaid()) {
            return 'deposit';
        }

        return (! $r->isBalancePaid() && $r->status === 'completed') ? 'balance' : null;
    }

    private function present(CustomOrderRequest $r): array
    {
        return [
            'id' => $r->id,
            'status' => $r->status,
            'name' => $r->name,
            'email' => $r->email,
            'phone' => $r->phone,
            'description' => $r->description,
            'category_preference' => $r->category_preference,
            'material_preference' => $r->material_preference,
            'color_preference' => $r->color_preference,
            'dimensions' => $r->dimensions,
            'budget_range' => $r->budget_range,
            'budget_currency' => $r->budget_currency ?: 'USD',
            'desired_timeline' => $r->desired_timeline,
            'reference_images' => array_values($r->referenceImages()),
            'product' => $r->product ? ['id' => $r->product->id, 'name' => $r->product->name, 'slug' => $r->product->slug] : null,
            'quoted_price' => $r->quoted_price,
            'quoted_currency' => $r->quoted_currency ?: 'USD',
            'admin_notes' => $r->admin_notes,
            'requires_installment' => $r->requiresInstallment(),
            'deposit_amount' => $r->requiresInstallment() ? $r->depositAmount() : null,
            'balance_amount' => $r->requiresInstallment() ? $r->balanceAmount() : null,
            'deposit_paid' => $r->isDepositPaid(),
            'balance_paid' => $r->isBalancePaid(),
            'fully_paid' => $r->isFullyPaid(),
            'next_payment' => $this->nextPayment($r),
            'created_at' => $r->created_at,
        ];
    }
}
