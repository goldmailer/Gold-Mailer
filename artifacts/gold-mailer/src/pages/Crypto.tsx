import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  if (price >= 0.01) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(8)}`;
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

export default function Crypto() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCoins = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: CoinData[] = await res.json();
      setCoins(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message ?? "Failed to load prices. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
    const id = setInterval(fetchCoins, 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = coins.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-0 max-w-5xl mx-auto px-4 sm:pl-16 py-8">
        {/* Header */}
        <div className="mb-6 pt-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center">
              <span className="text-lg">₿</span>
            </div>
            <div>
              <h1 className="text-2xl font-black">Crypto Prices</h1>
              <p className="text-xs text-muted-foreground">
                {coins.length > 0 ? `${coins.length} coins` : "Loading…"}
                {lastUpdated && (
                  <span className="ml-2 text-muted-foreground/60">
                    · Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={fetchCoins}
              disabled={loading}
              className="ml-auto p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card border border-border transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search Bitcoin, Ethereum, Solana..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 glass-card border-white/10"
          />
        </div>

        {/* Top coins highlight */}
        {!search && coins.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {coins.slice(0, 4).map(coin => {
              const isPos = coin.price_change_percentage_24h >= 0;
              return (
                <div key={coin.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" />
                    <span className="text-xs font-bold text-muted-foreground uppercase">{coin.symbol}</span>
                  </div>
                  <p className="text-base font-black">{formatPrice(coin.current_price)}</p>
                  <p className={`text-xs font-bold mt-0.5 flex items-center gap-0.5 ${isPos ? "text-green-400" : "text-red-400"}`}>
                    {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {isPos ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card rounded-xl p-5 text-center mb-6 border-red-500/20">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={fetchCoins} className="text-xs text-primary hover:underline">Retry</button>
          </div>
        )}

        {/* Table */}
        {loading && coins.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl h-14 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2.5 border-b border-white/5 text-xs text-muted-foreground font-medium">
              <span className="w-6 text-center">#</span>
              <span>Coin</span>
              <span className="text-right w-28">Price</span>
              <span className="text-right w-16">24h</span>
              <span className="text-right w-24 hidden md:block">Market Cap</span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Search size={28} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No coins match "{search}"</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map(coin => {
                  const isPos = coin.price_change_percentage_24h >= 0;
                  return (
                    <div
                      key={coin.id}
                      className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-3 items-center hover:bg-white/3 transition-colors"
                    >
                      <span className="w-6 text-center text-xs text-muted-foreground font-mono">
                        {coin.market_cap_rank}
                      </span>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="w-8 h-8 rounded-full shrink-0"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{coin.name}</p>
                          <p className="text-xs text-muted-foreground uppercase">{coin.symbol}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-right w-28 font-mono">
                        {formatPrice(coin.current_price)}
                      </span>
                      <div className={`flex items-center justify-end gap-0.5 w-16 text-xs font-bold ${isPos ? "text-green-400" : "text-red-400"}`}>
                        {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {isPos ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%
                      </div>
                      <span className="text-xs text-muted-foreground text-right w-24 hidden md:block">
                        {formatMarketCap(coin.market_cap)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-4">
          Prices from CoinGecko · Auto-refreshes every 60s
        </p>
      </main>
    </div>
  );
}
