<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function index()
    {
        return response()->json(Page::orderBy('title')->get(['id', 'slug', 'title', 'updated_at']));
    }

    public function show(Page $page)
    {
        return response()->json($page);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'slug' => 'required|string|max:255|unique:pages,slug',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $data['slug'] = Str::slug($data['slug']);

        return response()->json(Page::create($data), 201);
    }

    public function update(Request $request, Page $page)
    {
        $data = $request->validate([
            'slug' => 'required|string|max:255|unique:pages,slug,'.$page->id,
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $data['slug'] = Str::slug($data['slug']);
        $page->update($data);

        return response()->json($page);
    }

    public function destroy(Page $page)
    {
        $page->delete();

        return response()->json(['message' => 'Page deleted.']);
    }
}
