<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategoryDescriptionsSeeder extends Seeder
{
    public function run(): void
    {
        $descriptions = [
            'furniture' => 'Hand-carved and hand-built tables, chairs, screens and stools made by skilled woodworkers. Statement pieces for living, dining and sleeping spaces.',
            'wall-art' => 'Hand-made pieces to hang on the wall, from resist-dyed cloths and woven hangings to carved panels. Each carries the patterns and story of its region.',
            'mirrors' => 'Wall mirrors set in hand-carved wooden frames, made to anchor an entryway, bedroom or living room.',
            'masks' => 'Carved and decorated masks, many made for ceremony and ritual. Each comes with the story of the community and tradition it belongs to.',
            'paintings' => 'Original paintings by African artists, from scenes of everyday life to abstract and contemporary work.',
            'sculptures' => 'Hand-carved and modelled figures in wood, stone and other materials, from ancestral figures to contemporary forms.',
            'jewelry' => 'Beadwork, metalwork and other adornments made by hand, often in patterns and colors that carry meaning.',
            'pottery' => 'Hand-built and fired vessels, jars and bowls, shaped with techniques passed down through generations of potters.',
            'basketry' => 'Baskets and woven goods coiled and plaited by hand from raffia, sisal, grasses and palm leaves, made to be used and displayed.',
            'textiles' => 'Hand-woven, dyed and printed cloth, from strip-woven kente to indigo resist-dyed adire, sold as wraps, throws and lengths of fabric.',
            'traditional-clothing' => 'Garments made in traditional styles and fabrics, for celebrations and everyday wear.',
            'musical-instruments' => 'Hand-made drums, string and percussion instruments, crafted to be played as well as displayed.',
            'wood-carvings' => 'Decorative and functional objects carved by hand from wood, including bowls, panels and ornaments.',
        ];

        foreach ($descriptions as $slug => $text) {
            $category = Category::firstOrCreate(
                ['slug' => $slug],
                ['name' => ucwords(str_replace('-', ' ', $slug))]
            );

            $category->update(['description' => $text]);
        }
    }
}
