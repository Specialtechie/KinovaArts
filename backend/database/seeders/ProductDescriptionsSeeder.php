<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductDescriptionsSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            'Kente Strip-Woven Wrap' => [
                'description' => "A beautifully woven Kente textile inspired by the rich weaving traditions of Ghana's Ashanti people. Its vibrant patterns and intricate strip construction make it suitable for wearing, display or interior decoration.",
                'price' => 120,
                'category_slug' => 'textiles',
            ],
            'Adire Indigo Wall Hanging' => [
                'description' => 'Inspired by the Yoruba tradition of Adire indigo dyeing, this decorative textile brings traditional Nigerian artistry into contemporary interiors. A distinctive piece for walls and curated living spaces.',
                'price' => 180,
                'category_slug' => 'wall-art',
            ],
            'Makonde Ebony Ancestor Figure' => [
                'description' => "An expressive ebony-inspired sculptural piece celebrating the carving traditions of Tanzania's Makonde people. Its detailed form reflects the cultural significance and artistic heritage of African wood sculpture.",
                'price' => 350,
                'category_slug' => 'sculptures',
            ],
            'Akan Royal Stool' => [
                'description' => 'Inspired by traditional Akan craftsmanship, this distinctive stool celebrates the cultural importance of seating in Ghanaian heritage. A striking furniture piece for collectors and contemporary interiors.',
                'price' => 280,
                'category_slug' => 'furniture',
            ],
            'Zulu Beaded Necklace Set' => [
                'description' => "A colourful handcrafted jewellery set inspired by the beadwork traditions of South Africa's Zulu communities. Its detailed patterns and vibrant colours make it a distinctive accessory and cultural statement.",
                'price' => 60,
                'category_slug' => 'jewelry',
            ],
            'Terracotta Water Jar' => [
                'description' => "Inspired by the pottery traditions of Nigeria's Nupe people, this terracotta vessel celebrates traditional clay craftsmanship. Its earthy character makes it suitable for decorative displays and curated interiors.",
                'price' => 80,
                'category_slug' => 'pottery',
            ],
            'Woven Raffia Storage Basket' => [
                'description' => 'A handcrafted raffia basket inspired by African weaving traditions. Combining practical storage with natural texture, it adds warmth and character to living spaces.',
                'price' => 55,
                'category_slug' => 'basketry',
            ],
            'Dogon Carved Wooden Mask' => [
                'description' => "Inspired by the traditional carving heritage of Mali's Dogon people, this decorative mask celebrates the expressive forms of African wooden sculpture. A distinctive piece for art collections and interior displays.",
                'price' => 220,
                'category_slug' => 'masks',
            ],
            'Hand-Carved Dining Table & 6 Chairs Set' => [
                'description' => 'A statement dining collection featuring a hand-carved wooden table and six matching chairs. Designed to bring craftsmanship, character and timeless elegance to shared dining spaces.',
                'price' => 2500,
                'category_slug' => 'furniture',
            ],
            'Hand-Carved Wooden Room Divider Screen' => [
                'description' => 'A decorative wooden screen featuring handcrafted carving details. Ideal for creating visual separation between living spaces while introducing texture and artistic character into an interior.',
                'price' => 850,
                'category_slug' => 'furniture',
            ],
            'Hand-Carved Round Wall Mirror' => [
                'description' => 'A round wall mirror framed with hand-carved wooden detailing. Combining practical functionality with decorative craftsmanship, it makes a distinctive addition to bedrooms, hallways and living spaces.',
                'price' => 220,
                'category_slug' => 'mirrors',
            ],
            'Hand-Carved Dressing Table & Stool Set' => [
                'description' => 'A coordinated dressing table and stool set featuring hand-carved wooden details. Designed to combine everyday functionality with distinctive craftsmanship and timeless decorative appeal.',
                'price' => 1100,
                'category_slug' => 'furniture',
            ],
        ];

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($products as $name => $values) {
            $product = Product::where('name', $name)->first();

            if (! $product) {
                Product::create([
                    'name' => $name,
                    'slug' => $this->uniqueSlug($name),
                    'sku' => $this->uniqueSku($name),
                    'category_id' => Category::where('slug', $values['category_slug'])->value('id'),
                    'description' => $values['description'],
                    'price' => $values['price'],
                    'stock' => 1,
                    'status' => 'active',
                ]);

                $created++;
                $this->command->info("Product created: {$name}");
                continue;
            }

            if (blank($product->description)) {
                $product->description = $values['description'];
                $product->save();

                $updated++;
                $this->command->info("Description added: {$name}");
            } else {
                $skipped++;
                $this->command->line("Skipped (description already exists): {$name}");
            }
        }

        $this->command->info("Completed. Created: {$created}; descriptions updated: {$updated}; skipped: {$skipped}.");
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $suffix = 2;

        while (Product::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    private function uniqueSku(string $name): string
    {
        $base = 'KIN-'.Str::upper(Str::slug($name) ?: 'PRODUCT');
        $sku = $base;
        $suffix = 2;

        while (Product::where('sku', $sku)->exists()) {
            $sku = $base.'-'.$suffix++;
        }

        return $sku;
    }
}
