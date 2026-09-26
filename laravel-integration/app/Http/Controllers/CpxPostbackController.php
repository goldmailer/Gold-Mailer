<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class CpxPostbackController extends Controller
{
    private const CPX_APP_ID = '36554';
    private const CPX_SECRET = '7pSyJPPfNZYNV2zLirffBdjnTt39SY67';
    private const COIN_RATE = 700;   // 700 Coins = $1 USD (User gets 70%)
    private const BONUS_RATE = 70;   // 70 Coins = $1 USD screenout bonus

    /**
     * Handle GET https://tasknest.name.ng/api/postback/cpx
     */
    public function handle(Request $request): Response
    {
        $status    = (string) $request->query('status', $request->input('status', ''));
        $userId    = (string) $request->query('user_id', $request->input('user_id', ''));
        $amountUsd = (float)  $request->query('amount_usd', $request->input('amount_usd', 0));
        $hash      = (string) ($request->query('hash') ?? $request->query('secure_hash') ?? $request->input('hash') ?? '');
        $transId   = (string) $request->query('trans_id', $request->input('trans_id', ''));

        // 1. Security verification: hash must equal md5(user_id . "-" . "7pSyJPPfNZYNV2zLirffBdjnTt39SY67")
        $secret = config('services.cpx.secret', self::CPX_SECRET);
        $expectedHash = md5($userId . '-' . $secret);

        if (empty($userId) || empty($hash) || !hash_equals(strtolower($expectedHash), strtolower($hash))) {
            return response('hash invalid', 200)
                ->header('Content-Type', 'text/plain');
        }

        // 2. Ensure cpx_transactions table exists if migration has not run yet
        if (!Schema::hasTable('cpx_transactions')) {
            Schema::create('cpx_transactions', function (Blueprint $table) {
                $table->id();
                $table->string('trans_id', 191)->unique();
                $table->unsignedBigInteger('user_id')->index();
                $table->decimal('amount_usd', 12, 4)->default(0);
                $table->integer('coins')->default(0);
                $table->string('status', 64);
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // 3. Prevent duplicate: Check if trans_id already exists
        if (DB::table('cpx_transactions')->where('trans_id', $transId)->exists()) {
            return response('OK - duplicate', 200)
                ->header('Content-Type', 'text/plain');
        }

        // 4. Credit logic: Only credit if status = "complete" or status = 1 or status = "1"
        $normalizedStatus = strtolower(trim($status));
        $isComplete = ($normalizedStatus === 'complete' || $status === '1' || $status === 1);
        $isScreenoutBonus = ($normalizedStatus === 'screenout_bonus');

        $coins = 0;
        if ($isComplete) {
            $coins = (int) round($amountUsd * self::COIN_RATE);
        } elseif ($isScreenoutBonus) {
            $coins = (int) round($amountUsd * self::BONUS_RATE);
        }

        DB::transaction(function () use ($transId, $userId, $amountUsd, $coins, $status, $isComplete, $isScreenoutBonus) {
            DB::table('cpx_transactions')->insert([
                'trans_id'   => $transId,
                'user_id'    => (int) $userId,
                'amount_usd' => $amountUsd,
                'coins'      => $coins,
                'status'     => (string) $status,
                'created_at' => now(),
            ]);

            if (($isComplete || $isScreenoutBonus) && $coins > 0) {
                DB::table('users')
                    ->where('id', (int) $userId)
                    ->increment('coins', $coins);
            }
        });

        // 5. Always return plain text "OK" at end so CPX knows success. No HTML.
        return response('OK', 200)
            ->header('Content-Type', 'text/plain');
    }
}
