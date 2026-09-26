<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OfferwallPageController extends Controller
{
    private const CPX_APP_ID    = '36554';
    private const CPX_SECRET    = '7pSyJPPfNZYNV2zLirffBdjnTt39SY67';
    private const BITLABS_TOKEN = '8f1daa8f-fdbc-41e7-9010-45973b88e45';

    /**
     * GET https://tasknest.name.ng/dashboard/surveys
     */
    public function cpxSurveys(Request $request)
    {
        $user = Auth::user();
        $secret = config('services.cpx.secret', self::CPX_SECRET);
        $secureHash = md5($user->id . '-' . $secret);

        $iframeUrl = sprintf(
            'https://offers.cpx-research.com/index.php?app_id=%s&ext_user_id=%s&secure_hash=%s&subId_1=&subId_2=',
            self::CPX_APP_ID,
            urlencode((string) $user->id),
            $secureHash
        );

        $result = $request->query('result');

        return view('dashboard.surveys', [
            'user'       => $user,
            'secureHash' => $secureHash,
            'iframeUrl'  => $iframeUrl,
            'result'     => $result,
        ]);
    }

    /**
     * GET https://tasknest.name.ng/dashboard/bitlabs
     */
    public function bitlabs()
    {
        $user = Auth::user();
        $token = config('services.bitlabs.token', self::BITLABS_TOKEN);
        $iframeUrl = sprintf(
            'https://web.bitlabs.ai?token=%s&uid=%s',
            urlencode($token),
            urlencode((string) $user->id)
        );

        return view('dashboard.bitlabs', [
            'user'      => $user,
            'iframeUrl' => $iframeUrl,
        ]);
    }
}
