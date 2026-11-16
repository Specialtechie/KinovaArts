<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Product;
use Illuminate\Contracts\Support\Arrayable;

trait PresentsData
{
    /** Image paths saved as "/images/..." live on this server; the Vercel frontend needs absolute URLs. */
    protected function absoluteUrl(?string $url): ?string
    {
        if ($url && str_starts_with($url, '/')) {
            return url($url);
        }

        return $url;
    }

    protected function withAbsolute($model, array $keys): array
    {
        $data = $model instanceof Arrayable ? $model->toArray() : (array) $model;

        foreach ($keys as $key) {
            if (array_key_exists($key, $data)) {
                $data[$key] = $this->absoluteUrl($data[$key]);
            }
        }

        return $data;
    }

    protected function presentProduct(Product $product): array
    {
        $data = array_merge($product->toArray(), [
            'display_price' => $product->display_price,
        ]);

        if (! empty($data['images'])) {
            $data['images'] = array_map(fn ($img) => array_merge($img, ['url' => $this->absoluteUrl($img['url'])]), $data['images']);
        }

        if (! empty($data['featured_image'])) {
            $data['featured_image']['url'] = $this->absoluteUrl($data['featured_image']['url']);
        }

        if (! empty($data['category']) && array_key_exists('image_url', $data['category'])) {
            $data['category']['image_url'] = $this->absoluteUrl($data['category']['image_url']);
        }

        return $data;
    }

    protected function presentProducts(iterable $products): array
    {
        $out = [];

        foreach ($products as $product) {
            $out[] = $this->presentProduct($product);
        }

        return $out;
    }
}
