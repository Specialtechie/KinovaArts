<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Concerns\PresentsData;
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    use PresentsData;

    public function index()
    {
        return response()->json(
            Category::withCount('products')->orderBy('name')->get()
                ->map(fn ($c) => $this->withAbsolute($c, ['image_url']))->values()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:2048',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        $category = Category::create([...$data, 'slug' => $this->uniqueSlug($data['name'])]);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:2048',
            'parent_id' => 'nullable|exists:categories,id|not_in:'.$category->id,
        ]);

        $slug = Str::slug($data['name']) === $category->slug ? $category->slug : $this->uniqueSlug($data['name'], $category->id);
        $category->update([...$data, 'slug' => $slug]);

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $category->delete(); // products keep existing, just uncategorised

        return response()->json(['message' => 'Category deleted.']);
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'category';
        $candidate = $slug;
        $i = 2;

        while (Category::where('slug', $candidate)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $candidate = $slug.'-'.$i++;
        }

        return $candidate;
    }
}
