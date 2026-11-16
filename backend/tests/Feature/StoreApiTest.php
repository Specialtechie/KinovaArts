<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\CustomOrderRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_returns_json(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertExactJson(['ok' => true]);
    }

    public function test_registration_returns_a_customer_token_and_not_admin_access(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Local Customer',
            'email' => 'customer@example.test',
            'password' => 'local-password-123',
            'password_confirmation' => 'local-password-123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'is_admin']])
            ->assertJsonPath('user.is_admin', false);

        $this->withToken($response->json('token'))
            ->getJson('/api/admin/dashboard')
            ->assertForbidden();
    }

    public function test_public_catalog_returns_a_paginated_product_list(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'per_page', 'total']);
    }

    public function test_admin_user_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'total_orders',
                'revenue',
                'pending_orders',
                'inventory_value',
                'reviews_pending',
                'custom_requests_pending',
                'low_stock',
                'recent_orders',
            ]);
    }

    public function test_custom_order_quotes_use_installments_at_any_positive_price(): void
    {
        $request = new CustomOrderRequest(['quoted_price' => 80]);

        $this->assertTrue($request->requiresInstallment());
        $this->assertSame(56.0, $request->depositAmount());
        $this->assertSame(24.0, $request->balanceAmount());
        $this->assertFalse((new CustomOrderRequest(['quoted_price' => 0]))->requiresInstallment());
    }
}
