import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Coins, ExternalLink, Gift, ArrowLeft, ShieldCheck } from "lucide-react";

// Lightweight pure-JS MD5 for immediate client-side hash fallback
function md5Client(input: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX: number, lY: number) {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else return lResult ^ lX8 ^ lY8;
  }
  function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z); }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function convertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWordsTemp1 = lMessageLength + 8;
    const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1).fill(0);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function wordToHex(lValue: number) {
    let wordToHexValue = "", wordToHexValueTemp = "", lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValueTemp = "0" + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
    }
    return wordToHexValue;
  }
  const x = convertToWordArray(input);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478); d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db); b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf); d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613); b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8); d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1); b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122); d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e); b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);
    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562); d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51); b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d); d = GG(d, a, b, c, x[k + 10], 9, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681); b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6); d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87); b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905); d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9); b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);
    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942); d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122); b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44); d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60); b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6); d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085); b = HH(b, c, d, a, x[k + 6], 23, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039); d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8); b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);
    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244); d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7); b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3); d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d); b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f); d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314); b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82); d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb); b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);
    a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

const CPX_APP_ID = "36554";
const CPX_SECRET = "7pSyJPPfNZYNV2zLirffBdjnTt39SY67";

export default function CpxSurveys() {
  const { user } = useAuth();
  const userId = user?.id ?? 0;

  const fallbackHash = md5Client(`${userId}-${CPX_SECRET}`);
  const [secureHash, setSecureHash] = useState<string>(fallbackHash);
  const [coins, setCoins] = useState<number>(0);

  const searchParams = new URLSearchParams(window.location.search);
  const resultParam = searchParams.get("result");

  useEffect(() => {
    if (userId) {
      setSecureHash(md5Client(`${userId}-${CPX_SECRET}`));
    }
    fetch("/api/offerwalls/config", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.cpx?.secureHash) setSecureHash(data.cpx.secureHash);
        if (typeof data?.coins === "number") setCoins(data.coins);
      })
      .catch(() => {});
  }, [userId]);

  const iframeUrl = `https://offers.cpx-research.com/index.php?app_id=${CPX_APP_ID}&ext_user_id=${userId}&secure_hash=${secureHash}&subId_1=&subId_2=`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#888888] mb-1">
              <Link href="/dashboard" className="hover:text-white inline-flex items-center gap-1 transition-colors">
                <ArrowLeft size={14} /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#00ff88] font-semibold">CPX Research Surveys</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              CPX Research Surveys
            </h1>
            <p className="text-xs sm:text-sm text-[#888888] mt-1">
              Rate: <span className="text-white font-semibold">700 Coins = $1.00 USD</span> · Screenout Bonus:{" "}
              <span className="text-[#00ff88] font-semibold">70 Coins = $1.00 USD</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] px-4 py-2.5 flex items-center gap-2.5">
              <Coins size={18} className="text-[#00ff88]" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#888888] font-semibold">Your Coins</p>
                <p className="text-sm font-black text-white tabular-nums">{coins.toLocaleString()} Coins</p>
              </div>
            </div>
            <Link
              href="/dashboard/bitlabs"
              className="rounded-xl bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] px-4 py-2.5 text-xs font-bold text-white transition-colors inline-flex items-center gap-1.5"
            >
              BitLabs Offerwall <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        {/* Status Redirect Alerts (?result=success or ?result=screenout_bonus) */}
        {resultParam === "success" && (
          <div className="mb-6 rounded-2xl border border-[#00ff88]/40 bg-[#00ff88]/10 p-4 flex items-center gap-3 text-[#00ff88]">
            <CheckCircle2 size={20} className="shrink-0" />
            <p className="text-sm font-bold">Survey completed! Coins credited soon.</p>
          </div>
        )}

        {resultParam === "screenout_bonus" && (
          <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 flex items-center gap-3 text-amber-300">
            <Gift size={20} className="shrink-0" />
            <p className="text-sm font-bold">You got bonus</p>
          </div>
        )}

        {/* Security & Offerwall Container */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-[#1a1a1a] border-b border-[#262626] flex flex-wrap items-center justify-between gap-2 text-xs text-[#888888]">
            <span className="inline-flex items-center gap-1.5 text-zinc-300 font-medium">
              <ShieldCheck size={15} className="text-[#00ff88]" />
              Verified CPX Research Offerwall (App ID: {CPX_APP_ID})
            </span>
            <a
              href={iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff88] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Open in New Tab <ExternalLink size={12} />
            </a>
          </div>

          <iframe
            src={iframeUrl}
            title="CPX Research Surveys"
            className="w-full h-[2000px] border-0"
            style={{ width: "100%", height: "2000px", border: "none" }}
            allow="clipboard-write"
          />
        </div>
      </main>
    </div>
  );
}
