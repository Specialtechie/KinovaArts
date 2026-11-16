<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PresentsData;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\WishlistItem;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    use PresentsData;

    public function orders(Request $request)
    {
        return response()->json(
            $request->user()->orders()->with('items')->latest()->get()
        );
    }

    public function order(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        return response()->json($order->load('items'));
    }

    public function wishlist(Request $request)
    {
        $items = $request->user()->wishlistItems()
            ->with('product.featuredImage', 'product.category')
            ->latest()
            ->get()
            ->filter(fn ($item) => $item->product)
            ->map(fn ($item) => [
                'id' => $item->id,
                'product' => $this->presentProduct($item->product),
            ])
            ->values();

        return response()->json($items);
    }

    public function wishlistStore(Request $request)
    {
        $data = $request->validate(['product_id' => 'required|integer|exists:products,id']);

        WishlistItem::firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $data['product_id'],
        ]);

        return response()->json(['message' => 'Saved to your wishlist.'], 201);
    }

    public function wishlistDestroy(Request $request, int $productId)
    {
        WishlistItem::where('user_id', $request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        return response()->json(['message' => 'Removed from your wishlist.']);
    }

    public function reviewStore(Request $request, Product $product)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $already = Review::where('product_id', $product->id)
            ->where('user_id', $request->user()->id)
            ->exists();

        if ($already) {
            return response()->json(['message' => 'You have already reviewed this piece.'], 422);
        }

        Review::create([
            'product_id' => $product->id,
            'user_id' => $request->user()->id,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
            'approved' => false,
        ]);

        return response()->json(['message' => 'Thanks! Your review will appear once approved.'], 201);
    }
}
