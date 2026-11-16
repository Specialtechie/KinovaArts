<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Concerns\PresentsData;
use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CollectionController extends Controller
{
    use PresentsData;

    public function index()
    {
        return response()->json(
            Collection::withCount('products')->orderBy('name')->get()
                ->map(fn ($c) => $this->withAbsolute($c, ['hero_image_url']))->values()
        );
    }

    public function show(Collection $collection)
    {
        return response()->json($this->withAbsolute($collection->loadCount('products'), ['hero_image_url']));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $collection = Collection::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'slug' => $this->uniqueSlug($data['name']),
            'featured' => $request->boolean('featured'),
            'hero_image_url' => $this->heroImage($request),
        ]);

        return response()->json($this->withAbsolute($collection, ['hero_image_url']), 201);
    }

    public function update(Request $request, Collection $collection)
    {
        $data = $this->validated($request);

        $slug = Str::slug($data['name']) === $collection->slug ? $collection->slug : $this->uniqueSlug($data['name'], $collection->id);

        $collection->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'slug' => $slug,
            'featured' => $request->boolean('featured'),
            'hero_image_url' => $this->heroImage($request) ?? $collection->hero_image_url,
        ]);

        return response()->json($this->withAbsolute($collection, ['hero_image_url']));
    }

    public function destroy(Collection $collection)
    {
        $collection->delete(); // the pivot cascades; products themselves are untouched

        return response()->json(['message' => 'Collection deleted.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'featured' => 'nullable|boolean',
            'image' => 'nullable|image|max:8192',
            'hero_image_url' => 'nullable|string|max:2048',
        ]);
    }

    private function heroImage(Request $request): ?string
    {
        if ($request->hasFile('image')) {
            return Storage::disk('public')->url($request->file('image')->store('collections', 'public'));
        }

        return $request->filled('hero_image_url') ? $request->input('hero_image_url') : null;
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'collection';
        $candidate = $slug;
        $i = 2;

        while (Collection::where('slug', $candidate)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $candidate = $slug.'-'.$i++;
        }

        return $candidate;
    }
}
