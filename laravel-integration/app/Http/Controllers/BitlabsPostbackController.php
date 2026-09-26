<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class BitlabsPostbackController extends Controller
{
    private const COIN_RATE  = 700; // 700 Coins = $1 USD
    private const SECRET_KEY = 'PASTE_YOUR_SECRET_FROM_EYE_ICON_HERE';
    private const S2S_KEY    = 'PASTE_YOUR_S2S_KEY_HERE';

    /**
     * Handle GET and POST https://tasknest.name.ng/api/postback/bitlabs
     */
    public function handle(Request $request): Response
    {
        $secretKey = env('BITLABS_SECRET_KEY', self::SECRET_KEY);
        $s2sKey    = env('BITLABS_S2S_KEY', self::S2S_KEY);

        // 1. Verify HMAC SHA256 signature with Secret Key
        $providedHash = (string) (
            $request->header('X-Bitlabs-Signature')
            ?? $request->query('hash')
            ?? $request->input('hash')
            ?? $request->input('signature')
            ?? ''
        );

        if (!$this->verifySignature($request, $providedHash, [$secretKey, $s2sKey])) {
            return response('Invalid signature', 401)
                ->header('Content-Type', 'text/plain');
        }

        $transactionId = (string) (
            $request->input('transactionId')
            ?? $request->input('transaction_id')
            ?? $request->input('trans_id')
            ?? $request->input('tx_id')
            ?? ''
        );
        $userId = (int) ($request->input('user_id') ?? $request->input('uid') ?? 0);
        $reward = (float) ($request->input('reward') ?? $request->input('amount_usd') ?? $request->input('val') ?? 0);
        $type   = strtolower((string) $request->input('type', 'complete'));

        if (empty($transactionId) || $userId <= 0) {
            return response('Missing parameters', 400)
                ->header('Content-Type', 'text/plain');
        }

        // Ensure bitlabs_transactions table exists
        if (!Schema::hasTable('bitlabs_transactions')) {
            Schema::create('bitlabs_transactions', function (Blueprint $table) {
                $table->id();
                $table->string('transaction_id', 191)->unique();
                $table->unsignedBigInteger('user_id')->index();
                $table->decimal('reward', 12, 4)->default(0);
                $table->integer('coins')->default(0);
                $table->string('type', 64)->default('complete');
                $table->timestamps();
            });
        }

        // 2. Check duplicate transactionId in bitlabs_transactions unique
        if (DB::table('bitlabs_transactions')->where('transaction_id', $transactionId)->exists()) {
            return response('OK - duplicate', 200)
                ->header('Content-Type', 'text/plain');
        }

        // 3. Calculate coins = reward * 700
        // If type=reconciliation and reward negative, deduct
        $coins = (int) round($reward * self::COIN_RATE);
        if ($type === 'reconciliation' && $reward < 0) {
            $coins = -abs((int) round(abs($reward) * self::COIN_RATE));
        }

        DB::transaction(function () use ($transactionId, $userId, $reward, $coins, $type) {
            DB::table('bitlabs_transactions')->insert([
                'transaction_id' => $transactionId,
                'user_id'        => $userId,
                'reward'         => $reward,
                'coins'          => $coins,
                'type'           => $type,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            if ($coins > 0) {
                DB::table('users')
                    ->where('id', $userId)
                    ->increment('coins', $coins);
            } elseif ($coins < 0) {
                DB::table('users')
                    ->where('id', $userId)
                    ->decrement('coins', abs($coins));
            }
        });

        return response('OK', 200)
            ->header('Content-Type', 'text/plain');
    }

    private function verifySignature(Request $request, string $providedHash, array $keys): bool
    {
        if (empty($providedHash)) {
            return false;
        }

        // BitLabs signs the callback URL (without &hash=...) or raw payload using HMAC-SHA256
        $fullUrlWithoutHash = preg_replace('/([?&])(hash|signature)=[^&]*/i', '', $request->fullUrl());
        $fullUrlWithoutHash = rtrim($fullUrlWithoutHash, '?&');

        $params = $request->except(['hash', 'signature']);
        ksort($params);
        $sortedQueryString = http_build_query($params);
        $rawBody = $request->getContent();

        $payloads = array_filter([
            $fullUrlWithoutHash,
            $sortedQueryString,
            $rawBody,
        ]);

        foreach ($keys as $key) {
            if (empty($key)) continue;
            foreach ($payloads as $payload) {
                $calculated = hash_hmac('sha256', $payload, $key);
                if (hash_equals(strtolower($calculated), strtolower($providedHash))) {
                    return true;
                }
            }
        }

        return false;
    }
}
