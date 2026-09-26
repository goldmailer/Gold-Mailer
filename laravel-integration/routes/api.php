<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CpxPostbackController;
use App\Http\Controllers\BitlabsPostbackController;

/*
|--------------------------------------------------------------------------
| TaskNest Offerwall Postback API Routes (api.php)
|--------------------------------------------------------------------------
| Prefix: /api
| Full URLs:
| - GET/POST https://tasknest.name.ng/api/postback/cpx
| - GET/POST https://tasknest.name.ng/api/postback/bitlabs
*/

Route::match(['get', 'post'], '/postback/cpx', [CpxPostbackController::class, 'handle'])
    ->name('api.postback.cpx');

Route::match(['get', 'post'], '/postback/bitlabs', [BitlabsPostbackController::class, 'handle'])
    ->name('api.postback.bitlabs');
