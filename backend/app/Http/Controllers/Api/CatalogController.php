<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PresentsData;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Collection;
use App\Models\HomepageBanner;
use App\Models\Page;
use App\Models\Product;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    use PresentsData;

    public function home()
    {
        $banners = HomepageBanner::where('active', true)->orderBy('sort_order')->get()
            ->map(fn ($b) => $this->withAbsolute($b, ['image_url']))->values();

        $collections = Collection::where('featured', true)->take(3)->get()
            ->map(fn ($c) => $this->withAbsolute($c, ['hero_image_url']))->values();

        $newArrivals = Product::active()->with(['category', 'featuredImage'])->latest()->take(8)->get();

        $furniture = Product::active()
            ->whereHas('category', fn ($q) => $q->where('slug', 'furniture'))
            ->with(['category', 'images'])
            ->take(8)
            ->get();

        return response()->json([
            'banners' => $banners,
            'featured_collections' => $collections,
            'new_arrivals' => $this->presentProducts($newArrivals),
            'furniture' => $this->presentProducts($furniture),
        ]);
    }

    public function productIndex(Request $request)
    {
        $query = Product::active()
            ->with(['category', 'featuredImage'])
            ->when($request->query('category'), function ($q, $category) {
                if (is_numeric($category)) {
                    $q->where('category_id', $category);
                } else {
                    $q->whereHas('category', fn ($c) => $c->where('slug', $category));
                }
            })
            ->when($request->query('collection'), function ($q, $slug) {
                $q->whereHas('collections', fn ($c) => $c->where('slug', $slug));
            })
            ->when($request->query('q'), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('material', 'like', "%{$search}%")
                        ->orWhere('country_of_origin', 'like', "%{$search}%");
                });
            });

        match ($request->query('sort')) {
            'price_asc' => $query->orderByRaw('COALESCE(sale_price, price) asc'),
            'price_desc' => $query->orderByRaw('COALESCE(sale_price, price) desc'),
            default => $query->latest(),
        };

        $perPage = min(max((int) $request->query('per_page', 24), 1), 60);
        $paginator = $query->paginate($perPage);
        $paginator->through(fn ($product) => $this->presentProduct($product));

        return response()->json($paginator);
    }

    public function productShow(string $slug)
    {
        $product = Product::active()
            ->where('slug', $slug)
            ->with(['category', 'images', 'collections', 'approvedReviews.user'])
            ->firstOrFail();

        $data = $this->presentProduct($product);

        // Never expose reviewer emails: send only what the page needs.
        unset($data['approved_reviews']);
        $data['reviews'] = $product->approvedReviews->map(fn ($r) => [
            'id' => $r->id,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'author' => $r->user?->name,
            'created_at' => $r->created_at,
        ])->values();
        $data['rating_count'] = $product->approvedReviews->count();
        $data['rating_average'] = $data['rating_count'] > 0
            ? round($product->approvedReviews->avg('rating'), 1)
            : null;

        $related = Product::active()
            ->where('id', '!=', $product->id)
            ->when($product->category_id, fn ($q) => $q->where('category_id', $product->category_id))
            ->with(['category', 'featuredImage'])
            ->latest()
            ->take(4)
            ->get();
        $data['related'] = $this->presentProducts($related);

        return response()->json($data);
    }

    public function categoryIndex()
    {
        return response()->json(
            Category::orderBy('name')->get()->map(fn ($c) => $this->withAbsolute($c, ['image_url']))->values()
        );
    }

    public function collectionIndex()
    {
        return response()->json(
            Collection::withCount('products')->orderBy('name')->get()
                ->map(fn ($c) => $this->withAbsolute($c, ['hero_image_url']))->values()
        );
    }

    public function collectionShow(string $slug)
    {
        $collection = Collection::where('slug', $slug)->firstOrFail();
        $products = $collection->products()->active()->with(['category', 'featuredImage'])->get();

        return response()->json([
            'collection' => $this->withAbsolute($collection, ['hero_image_url']),
            'products' => $this->presentProducts($products),
        ]);
    }

    public function pageShow(string $slug)
    {
        return response()->json(Page::where('slug', $slug)->firstOrFail());
    }
}
