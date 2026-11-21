<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\CustomOrderStatusUpdatedMail;
use App\Models\CustomOrderRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

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
        $customOrder->load(['product:id,name,slug', 'user:id,name,email', 'orders']);

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
            'admin_notes' => 'nullable|string',
        ]);

        $statusChanged = $customOrder->status !== $data['status'];
        $quoteChanged = (float) ($data['quoted_price'] ?? $customOrder->quoted_price) !== (float) $customOrder->quoted_price
            || ($data['quoted_currency'] ?? $customOrder->quoted_currency ?? 'USD') !== ($customOrder->quoted_currency ?? 'USD');

        $customOrder->update($data);

        if (
            ($statusChanged && in_array($data['status'], ['quoted', 'declined', 'completed'], true))
            || ($data['status'] === 'quoted' && $quoteChanged)
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
