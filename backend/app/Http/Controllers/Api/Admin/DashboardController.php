<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomOrderRequest;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $paid = ['paid', 'processing', 'shipped', 'delivered'];

        return response()->json([
            'total_orders' => Order::whereIn('status', $paid)->count(),
            'revenue' => (float) Order::whereIn('status', $paid)->sum('total'),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'inventory_value' => (float) Product::sum(DB::raw('price * stock')),
            'reviews_pending' => Review::where('approved', false)->count(),
            'custom_requests_pending' => CustomOrderRequest::whereIn('status', ['pending', 'reviewing'])->count(),
            'low_stock' => Product::whereColumn('stock', '<=', 'low_stock_threshold')
                ->where('status', 'active')
                ->take(5)
                ->get(['id', 'name', 'slug', 'stock', 'low_stock_threshold']),
            'recent_orders' => Order::latest()->take(5)->get(['id', 'order_number', 'status', 'total', 'shipping_name', 'created_at']),
        ]);
    }
}
