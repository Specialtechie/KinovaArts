<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryLog;
use App\Models\Order;
use Illuminate\Http\Request;

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
        return response()->json($order->load(['items', 'user:id,name,email', 'customOrderRequest']));
    }

    public function update(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,paid,processing,shipped,delivered,cancelled,refunded',
            'courier' => 'nullable|string|max:255',
            'tracking_number' => 'nullable|string|max:255',
        ]);

        $previous = $order->status;
        $order->update($data);

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

        return response()->json($order->fresh()->load('items'));
    }
}
