<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OfferwallPageController;

/*
|--------------------------------------------------------------------------
| TaskNest Offerwall Web Routes (web.php)
|--------------------------------------------------------------------------
| Protected by 'auth' middleware:
| - GET https://tasknest.name.ng/dashboard/surveys
| - GET https://tasknest.name.ng/dashboard/bitlabs
*/

Route::middleware(['auth'])->prefix('dashboard')->group(function () {
    Route::get('/surveys', [OfferwallPageController::class, 'cpxSurveys'])
        ->name('dashboard.surveys');

    Route::get('/bitlabs', [OfferwallPageController::class, 'bitlabs'])
        ->name('dashboard.bitlabs');
});
