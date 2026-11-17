<?php

namespace Database\Seeders;

use App\Models\Collection;
use Illuminate\Database\Seeder;

class CollectionDescriptionsSeeder extends Seeder
{
    public function run(): void
    {
        $collections = [
            'modern-african-living' => [
                'description' => 'Discover contemporary African design through thoughtfully crafted furniture, décor and accessories. A celebration of African creativity, craftsmanship and modern living.',
                'featured' => true,
            ],
            'hand-carved-furniture' => [
                'description' => 'Explore distinctive furniture shaped by skilled African artisans. From statement dining sets to decorative screens, every piece celebrates the beauty of hand-carved wood.',
                'featured' => true,
            ],
            'limited-edition' => [
                'description' => 'Discover distinctive, limited-edition pieces created in small quantities. Each selection offers exceptional craftsmanship, individuality and collectible African artistry.',
                'featured' => true,
            ],
            'new-arrivals' => [
                'description' => 'Explore the latest additions to our collection, featuring newly sourced artworks, handcrafted furniture and distinctive pieces from African artisans.',
                'featured' => false,
            ],
            'best-sellers' => [
                'description' => 'Discover customer favourites and popular pieces celebrated for their craftsmanship, design and timeless African character.',
                'featured' => false,
            ],
        ];

        foreach ($collections as $slug => $values) {
            $collection = Collection::firstOrCreate(
                ['slug' => $slug],
                array_merge(
                    ['name' => ucwords(str_replace('-', ' ', $slug))],
                    $values
                )
            );

            $collection->update($values);
        }
    }
}
