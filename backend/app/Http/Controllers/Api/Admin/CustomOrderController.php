<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\CustomOrderStatusUpdatedMail;
use App\Models\CustomOrderRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class CustomOrderController extends Controller
{
    public function index(Request $request)
    {
        $requests = CustomOrderRequest::with('product:id,name,slug')
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate(min(max((int) $request->query('per_page', 25), 1), 100));

        return response()->json($requests);
    }

    public function show(CustomOrderRequest $customOrder)
    {
        $customOrder->load([
            'product:id,name,slug',
            'user:id,name,email',
            'orders',
            'messages.sender:id,name,is_admin',
        ]);

        return response()->json(array_merge($customOrder->toArray(), [
            'reference_images' => array_values($customOrder->referenceImages()),
            'requires_installment' => $customOrder->requiresInstallment(),
            'deposit_amount' => $customOrder->requiresInstallment() ? $customOrder->depositAmount() : null,
            'balance_amount' => $customOrder->requiresInstallment() ? $customOrder->balanceAmount() : null,
            'deposit_paid' => $customOrder->isDepositPaid(),
            'balance_paid' => $customOrder->isBalancePaid(),
            'fully_paid' => $customOrder->isFullyPaid(),
        ]));
    }

    public function update(Request $request, CustomOrderRequest $customOrder)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,reviewing,quoted,accepted,declined,completed',
            'quoted_price' => 'nullable|numeric|min:0',
            'quoted_currency' => ['sometimes', 'required', 'string', 'size:3', 'regex:/^[A-Z]{3}$/'],
            'delivery_fee' => 'nullable|numeric|min:0',
            'admin_notes' => 'nullable|string',
            'completion_details' => 'nullable|string|max:5000',
            'completion_images' => 'nullable|array|max:3',
            'completion_images.*' => 'image|mimes:jpg,jpeg,png,webp|max:1024',
        ]);

        $statusChanged = $customOrder->status !== $data['status'];
        $newPrice = (float) ($data['quoted_price'] ?? $customOrder->quoted_price);
        $newCurrency = $data['quoted_currency'] ?? $customOrder->quoted_currency ?? 'USD';
        $newDeliveryFee = (float) ($data['delivery_fee'] ?? $customOrder->delivery_fee);
        $priceOrCurrencyChanged = $newPrice !== (float) $customOrder->quoted_price
            || $newCurrency !== ($customOrder->quoted_currency ?? 'USD');
        $deliveryFeeChanged = $newDeliveryFee !== (float) $customOrder->delivery_fee;

        if (
            $priceOrCurrencyChanged
            && ($customOrder->isDepositPaid() || $customOrder->hasPendingOrderOfType('deposit'))
        ) {
            return response()->json([
                'message' => 'The quote price and currency cannot be changed after a deposit has been paid.',
                'errors' => ['quoted_price' => ['The quote price and currency cannot be changed after a deposit has been paid.']],
            ], 422);
        }

        if (
            $deliveryFeeChanged
            && ($customOrder->isBalancePaid() || $customOrder->hasPendingOrderOfType('balance'))
        ) {
            return response()->json([
                'message' => 'The delivery fee cannot be changed after the balance has been paid.',
                'errors' => ['delivery_fee' => ['The delivery fee cannot be changed after the balance has been paid.']],
            ], 422);
        }

        if ($newDeliveryFee > 0 && ! $customOrder->shipping_line1) {
            return response()->json([
                'message' => 'A delivery address is needed before adding a delivery fee.',
                'errors' => ['delivery_fee' => ['A delivery address is needed before adding a delivery fee.']],
            ], 422);
        }

        if (
            $data['status'] === 'completed'
            && blank($data['completion_details'] ?? $customOrder->completion_details)
        ) {
            return response()->json([
                'message' => 'Add a short completion update before marking this custom order as completed.',
                'errors' => ['completion_details' => ['Add a short completion update before marking this custom order as completed.']],
            ], 422);
        }

        $quoteChanged = $priceOrCurrencyChanged || $deliveryFeeChanged;
        $completionChanged = ($data['completion_details'] ?? $customOrder->completion_details) !== $customOrder->completion_details;
        unset($data['completion_images']);

        $images = $request->file('completion_images', []);
        if (count($images) > 0) {
            $completionChanged = true;
            $data['completion_images'] = array_map(
                fn ($file) => Storage::disk('public')->url($file->store('custom-order-completions', 'public')),
                $images,
            );
        }

        $customOrder->update($data);

        if (
            $statusChanged
            || ($data['status'] === 'quoted' && $quoteChanged)
            || $deliveryFeeChanged
            || ($data['status'] === 'completed' && $completionChanged)
        ) {
            try {
                Mail::to($customOrder->email)->send(new CustomOrderStatusUpdatedMail($customOrder->fresh()));
            } catch (\Throwable $e) {
                report($e); // the update is saved; a mail failure must not undo it
            }
        }

        return $this->show($customOrder);
    }
}
