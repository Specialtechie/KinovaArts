<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Concerns\PresentsData;
use App\Http\Controllers\Controller;
use App\Models\HomepageBanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BannerController extends Controller
{
    use PresentsData;

    public function index()
    {
        return response()->json(
            HomepageBanner::orderBy('sort_order')->get()->map(fn ($b) => $this->withAbsolute($b, ['image_url']))->values()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $imageUrl = $this->imageUrl($request);

        if (! $imageUrl) {
            return response()->json(['message' => 'Upload an image or paste an image URL.'], 422);
        }

        $banner = HomepageBanner::create([
            'title' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'active' => $request->boolean('active', true),
            'image_url' => $imageUrl,
        ]);

        return response()->json($this->withAbsolute($banner, ['image_url']), 201);
    }

    public function update(Request $request, HomepageBanner $banner)
    {
        $data = $this->validated($request);

        $banner->update([
            'title' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? $banner->sort_order,
            'active' => $request->boolean('active', $banner->active),
            'image_url' => $this->imageUrl($request) ?? $banner->image_url,
        ]);

        return response()->json($this->withAbsolute($banner, ['image_url']));
    }

    public function destroy(HomepageBanner $banner)
    {
        $banner->delete();

        return response()->json(['message' => 'Banner deleted.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'link_url' => 'nullable|string|max:2048',
            'sort_order' => 'nullable|integer',
            'active' => 'nullable|boolean',
            'image' => 'nullable|image|max:8192',
            'image_url' => 'nullable|string|max:2048',
        ]);
    }

    private function imageUrl(Request $request): ?string
    {
        if ($request->hasFile('image')) {
            return Storage::disk('public')->url($request->file('image')->store('banners', 'public'));
        }

        return $request->filled('image_url') ? $request->input('image_url') : null;
    }
}
