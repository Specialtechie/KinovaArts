<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Concerns\PresentsData;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    use PresentsData;

    /** One image per request (file or URL), so uploads stay under Vercel's request size limit. */
    public function store(Request $request, Product $product)
    {
        $request->validate([
            'image' => 'nullable|image|max:8192',
            'url' => 'nullable|string|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $url = Storage::disk('public')->url($request->file('image')->store('products', 'public'));
        } elseif ($request->filled('url')) {
            $url = trim($request->input('url'));

            if (! str_starts_with($url, '/') && ! filter_var($url, FILTER_VALIDATE_URL)) {
                return response()->json(['message' => 'That does not look like a valid image URL.'], 422);
            }
        } else {
            return response()->json(['message' => 'Upload an image or paste an image URL.'], 422);
        }

        $next = (int) ProductImage::where('product_id', $product->id)->max('sort_order') + 1;

        $image = $product->images()->create([
            'url' => $url,
            'is_featured' => false,
            'sort_order' => $next,
        ]);

        $this->ensureFeatured($product);

        return response()->json($this->withAbsolute($image->fresh(), ['url']), 201);
    }

    public function destroy(Product $product, ProductImage $image)
    {
        abort_unless($image->product_id === $product->id, 404);

        $image->delete();
        $this->ensureFeatured($product);

        return response()->json(['message' => 'Image removed.']);
    }

    public function feature(Product $product, ProductImage $image)
    {
        abort_unless($image->product_id === $product->id, 404);

        $product->images()->update(['is_featured' => false]);
        $image->update(['is_featured' => true]);

        return response()->json(['message' => 'Cover image updated.']);
    }

    private function ensureFeatured(Product $product): void
    {
        if (! $product->images()->where('is_featured', true)->exists()) {
            $product->images()->first()?->update(['is_featured' => true]);
        }
    }
}
