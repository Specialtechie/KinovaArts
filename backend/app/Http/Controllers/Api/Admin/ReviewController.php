<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $reviews = Review::with(['product:id,name,slug', 'user:id,name,email'])
            ->when($request->has('approved'), fn ($q) => $q->where('approved', $request->boolean('approved')))
            ->latest()
            ->paginate(25);

        return response()->json($reviews);
    }

    public function approve(Review $review)
    {
        $review->update(['approved' => true]);

        return response()->json($review);
    }

    public function destroy(Review $review)
    {
        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }
}
