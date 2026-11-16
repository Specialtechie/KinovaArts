<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Concerns\PresentsData;
use App\Http\Controllers\Controller;
use App\Models\InventoryLog;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    use PresentsData;

    public function index(Request $request)
    {
        $products = Product::with(['category', 'featuredImage'])
            ->when($request->query('q'), function ($query, $search) {
                $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"));
            })
            ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate(min(max((int) $request->query('per_page', 25), 1), 100));

        $products->through(fn ($p) => $this->presentProduct($p));

        return response()->json($products);
    }

    public function show(Product $product)
    {
        return response()->json($this->full($product));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $product = Product::create([
            ...Arr::except($data, ['collection_ids', 'images']),
            'slug' => $this->uniqueSlug(($data['slug'] ?? null) ?: $data['name']),
            'sku' => ($data['sku'] ?? null) ?: strtoupper(Str::random(8)),
        ]);

        $this->syncImages($request, $product);
        $product->collections()->sync($data['collection_ids'] ?? []);

        InventoryLog::create([
            'product_id' => $product->id,
            'change' => $product->stock,
            'reason' => 'manual adjustment',
        ]);

        return response()->json($this->full($product), 201);
    }

    public function update(Request $request, Product $product)
    {
        $data = $this->validated($request, $product->id);
        $previousStock = $product->stock;

        $slug = $product->slug;
        if (! empty($data['slug']) && Str::slug($data['slug']) !== $product->slug) {
            $slug = $this->uniqueSlug($data['slug'], $product->id);
        }

        $product->update([
            ...Arr::except($data, ['collection_ids', 'images']),
            'slug' => $slug,
            'sku' => ($data['sku'] ?? null) ?: $product->sku,
        ]);

        $this->syncImages($request, $product);

        // Multipart forms cannot send an empty array, so clearing needs the explicit flag.
        if ($request->has('collection_ids') || $request->boolean('sync_collections')) {
            $product->collections()->sync($data['collection_ids'] ?? []);
        }

        $change = $product->stock - $previousStock;
        if ($change !== 0) {
            InventoryLog::create([
                'product_id' => $product->id,
                'change' => $change,
                'reason' => 'manual adjustment',
            ]);
        }

        return response()->json($this->full($product));
    }

    /** Archived rather than deleted, so past orders keep their history. */
    public function destroy(Product $product)
    {
        $product->update(['status' => 'archived']);

        return response()->json(['message' => 'Product archived.']);
    }

    private function full(Product $product): array
    {
        $product->refresh()->load(['category', 'images', 'collections']);

        return array_merge($this->presentProduct($product), [
            'collection_ids' => $product->collections->pluck('id')->values(),
        ]);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku'.($ignoreId ? ",{$ignoreId}" : ''),
            'description' => 'required|string',
            'story_behind' => 'nullable|string',
            'care_instructions' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'material' => 'nullable|string|max:255',
            'wood_type' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'country_of_origin' => 'nullable|string|max:255',
            'region_or_tribe' => 'nullable|string|max:255',
            'width_cm' => 'nullable|numeric',
            'height_cm' => 'nullable|numeric',
            'depth_cm' => 'nullable|numeric',
            'weight_kg' => 'nullable|numeric',
            'shipping_weight_kg' => 'nullable|numeric',
            'barcode' => 'nullable|string|max:100',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string|max:255',
            'stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'status' => 'required|in:draft,active,archived',
            'category_id' => 'nullable|exists:categories,id',
            'collection_ids' => 'nullable|array',
            'collection_ids.*' => 'integer|exists:collections,id',
            'images' => 'nullable|array|max:10',
            'images.*' => 'image|max:8192',
        ]);

        // The column is NOT NULL (default 3): an empty field means "leave it alone".
        if (array_key_exists('low_stock_threshold', $data) && $data['low_stock_threshold'] === null) {
            unset($data['low_stock_threshold']);
        }

        return $data;
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'product';
        $candidate = $slug;
        $i = 2;

        while (Product::where('slug', $candidate)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $candidate = $slug.'-'.$i++;
        }

        return $candidate;
    }

    /**
     * images[]            new files, appended
     * image_urls[]        pasted URLs (array or newline-separated string), appended
     * remove_image_ids[]  existing images to delete
     * featured_image_id   which image is the cover
     * replace_images=1    delete all existing images first
     */
    private function syncImages(Request $request, Product $product): void
    {
        if ($request->boolean('replace_images')) {
            $product->images()->delete();
        }

        if ($request->filled('remove_image_ids')) {
            $product->images()->whereIn('id', (array) $request->input('remove_image_ids'))->delete();
        }

        $next = (int) ProductImage::where('product_id', $product->id)->max('sort_order') + 1;

        foreach ($request->file('images', []) as $file) {
            $path = $file->store('products', 'public');
            $product->images()->create([
                'url' => Storage::disk('public')->url($path),
                'is_featured' => false,
                'sort_order' => $next++,
            ]);
        }

        foreach ($this->urlList($request->input('image_urls')) as $url) {
            $product->images()->create([
                'url' => $url,
                'is_featured' => false,
                'sort_order' => $next++,
            ]);
        }

        if ($request->filled('featured_image_id')) {
            $product->images()->update(['is_featured' => false]);
            $product->images()->where('id', $request->input('featured_image_id'))->update(['is_featured' => true]);
        }

        if (! $product->images()->where('is_featured', true)->exists()) {
            $product->images()->first()?->update(['is_featured' => true]);
        }
    }

    private function urlList($value): array
    {
        $items = is_array($value) ? $value : preg_split('/\r\n|\r|\n/', (string) $value);

        return array_values(array_filter(
            array_map('trim', $items),
            fn ($u) => $u !== '' && (str_starts_with($u, '/') || filter_var($u, FILTER_VALIDATE_URL))
        ));
    }
}
