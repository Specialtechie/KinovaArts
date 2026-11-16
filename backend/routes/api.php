<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CustomOrderController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));

/* ---------- Auth ---------- */
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

/* ---------- Public catalog ---------- */
Route::get('/home', [CatalogController::class, 'home']);
Route::get('/products', [CatalogController::class, 'productIndex']);
Route::get('/products/{slug}', [CatalogController::class, 'productShow']);
Route::get('/categories', [CatalogController::class, 'categoryIndex']);
Route::get('/collections', [CatalogController::class, 'collectionIndex']);
Route::get('/collections/{slug}', [CatalogController::class, 'collectionShow']);
Route::get('/pages/{slug}', [CatalogController::class, 'pageShow']);

/* ---------- Public actions ---------- */
Route::post('/cart/quote', [CartController::class, 'quote']);
Route::post('/custom-orders', [CustomOrderController::class, 'store'])->middleware('throttle:10,1');

/* ---------- Signed-in customer ---------- */
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::post('/checkout', [CheckoutController::class, 'store']);
    Route::get('/checkout/verify', [CheckoutController::class, 'verify']);

    Route::get('/account/orders', [AccountController::class, 'orders']);
    Route::get('/account/orders/{order}', [AccountController::class, 'order']);

    Route::get('/account/wishlist', [AccountController::class, 'wishlist']);
    Route::post('/account/wishlist', [AccountController::class, 'wishlistStore']);
    Route::delete('/account/wishlist/{productId}', [AccountController::class, 'wishlistDestroy']);

    Route::post('/products/{product}/reviews', [AccountController::class, 'reviewStore']);

    Route::get('/account/custom-orders', [CustomOrderController::class, 'mine']);
    Route::get('/account/custom-orders/{customOrder}', [CustomOrderController::class, 'show']);
    Route::post('/account/custom-orders/{customOrder}/pay/{type}', [CustomOrderController::class, 'pay'])
        ->where('type', 'full|deposit|balance');
});

/* ---------- Admin ---------- */
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [Admin\DashboardController::class, 'index']);

    // Updates are POST (not PUT/PATCH) so multipart image uploads work.
    Route::get('/products', [Admin\ProductController::class, 'index']);
    Route::post('/products', [Admin\ProductController::class, 'store']);
    Route::get('/products/{product}', [Admin\ProductController::class, 'show']);
    Route::post('/products/{product}', [Admin\ProductController::class, 'update']);
    Route::delete('/products/{product}', [Admin\ProductController::class, 'destroy']);
    Route::post('/products/{product}/images', [Admin\ProductImageController::class, 'store']);
    Route::delete('/products/{product}/images/{image}', [Admin\ProductImageController::class, 'destroy']);
    Route::post('/products/{product}/images/{image}/feature', [Admin\ProductImageController::class, 'feature']);

    Route::get('/categories', [Admin\CategoryController::class, 'index']);
    Route::post('/categories', [Admin\CategoryController::class, 'store']);
    Route::post('/categories/{category}', [Admin\CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [Admin\CategoryController::class, 'destroy']);

    Route::get('/collections', [Admin\CollectionController::class, 'index']);
    Route::post('/collections', [Admin\CollectionController::class, 'store']);
    Route::get('/collections/{collection}', [Admin\CollectionController::class, 'show']);
    Route::post('/collections/{collection}', [Admin\CollectionController::class, 'update']);
    Route::delete('/collections/{collection}', [Admin\CollectionController::class, 'destroy']);

    Route::get('/orders', [Admin\OrderController::class, 'index']);
    Route::get('/orders/{order}', [Admin\OrderController::class, 'show']);
    Route::post('/orders/{order}', [Admin\OrderController::class, 'update']);

    Route::get('/coupons', [Admin\CouponController::class, 'index']);
    Route::post('/coupons', [Admin\CouponController::class, 'store']);
    Route::post('/coupons/{coupon}', [Admin\CouponController::class, 'update']);
    Route::delete('/coupons/{coupon}', [Admin\CouponController::class, 'destroy']);

    Route::get('/banners', [Admin\BannerController::class, 'index']);
    Route::post('/banners', [Admin\BannerController::class, 'store']);
    Route::post('/banners/{banner}', [Admin\BannerController::class, 'update']);
    Route::delete('/banners/{banner}', [Admin\BannerController::class, 'destroy']);

    Route::get('/pages', [Admin\PageController::class, 'index']);
    Route::post('/pages', [Admin\PageController::class, 'store']);
    Route::get('/pages/{page}', [Admin\PageController::class, 'show']);
    Route::post('/pages/{page}', [Admin\PageController::class, 'update']);
    Route::delete('/pages/{page}', [Admin\PageController::class, 'destroy']);

    Route::get('/custom-orders', [Admin\CustomOrderController::class, 'index']);
    Route::get('/custom-orders/{customOrder}', [Admin\CustomOrderController::class, 'show']);
    Route::post('/custom-orders/{customOrder}', [Admin\CustomOrderController::class, 'update']);

    Route::get('/reviews', [Admin\ReviewController::class, 'index']);
    Route::post('/reviews/{review}/approve', [Admin\ReviewController::class, 'approve']);
    Route::delete('/reviews/{review}', [Admin\ReviewController::class, 'destroy']);

    Route::get('/settings', [Admin\SettingsController::class, 'show']);
    Route::post('/settings', [Admin\SettingsController::class, 'update']);
});
