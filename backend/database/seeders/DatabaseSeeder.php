<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(CategoryDescriptionsSeeder::class);
        $this->call(CollectionDescriptionsSeeder::class);
        $this->call(ProductDescriptionsSeeder::class);

        $email = config('services.local_admin.email');
        $password = config('services.local_admin.password');

        if (! $email || ! $password) {
            return;
        }

        $admin = User::firstOrNew(['email' => strtolower($email)]);
        $admin->name = 'Kinova Arts Admin';
        $admin->password = $password;
        $admin->is_admin = true;
        $admin->save();
    }
}
