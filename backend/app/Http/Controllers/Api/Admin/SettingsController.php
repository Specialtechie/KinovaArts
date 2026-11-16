<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show()
    {
        return response()->json([
            'usd_to_ngn_rate' => (float) Setting::get('usd_to_ngn_rate', 1500),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate(['usd_to_ngn_rate' => 'required|numeric|min:1']);

        Setting::set('usd_to_ngn_rate', $data['usd_to_ngn_rate']);

        return $this->show();
    }
}
