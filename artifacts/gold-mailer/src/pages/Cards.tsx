import { useState } from "react";
import { useGetCards, useGetCard, getGetCardQueryKey } from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { CreditCard, Eye, EyeOff, X, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

function maskCard(num: string) {
  const clean = num.replace(/\s/g, "");
  return `•••• •••• •••• ${clean.slice(-4)}`;
}

function CardDetailModal({ cardId, onClose }: { cardId: number; onClose: () => void }) {
  const [showCvv, setShowCvv] = useState(false);
  const [showNum, setShowNum] = useState(false);
  const [copied, setCopied] = useState<string>("");
  const { toast } = useToast();

  const { data: card, isLoading } = useGetCard(cardId, {
    query: { enabled: !!cardId, queryKey: getGetCardQueryKey(cardId) },
  });

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: `${label} copied` });
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-bold text-lg">Card Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : card ? (
          <div className="p-6 space-y-4">
            {/* Card visual */}
            <div className="virtual-card h-44 p-5 flex flex-col justify-between text-white">
              <div className="flex justify-between">
                <CreditCard size={24} className="text-yellow-400" />
                <span className="text-yellow-400 font-bold text-xs tracking-widest">GOLDMAILER</span>
              </div>
              <div>
                <p className="font-mono tracking-widest text-base mb-2">
                  {showNum ? (card as any).cardNumber.replace(/(.{4})/g, "$1 ").trim() : maskCard((card as any).cardNumber)}
                </p>
                <div className="flex justify-between text-xs">
                  <span className="font-medium uppercase">{(card as any).cardholderName}</span>
                  <span>{(card as any).expiryDate}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {[
                { label: "Card Number", value: (card as any).cardNumber, key: "num", sensitive: true, show: showNum, toggle: () => setShowNum(!showNum) },
                { label: "Expiry Date", value: (card as any).expiryDate, key: "exp" },
                { label: "CVV/CVC", value: (card as any).cvv, key: "cvv", sensitive: true, show: showCvv, toggle: () => setShowCvv(!showCvv) },
                { label: "Cardholder Name", value: (card as any).cardholderName, key: "name" },
                { label: "Billing Address", value: [(card as any).billingAddress1, (card as any).billingAddress2, (card as any).billingCity, (card as any).billingState, (card as any).billingCountry].filter(Boolean).join(", "), key: "addr" },
                { label: "ZIP Code", value: (card as any).billingZip, key: "zip" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-sm font-mono truncate" data-testid={`text-card-${item.key}`}>
                      {item.sensitive && !item.show ? "•".repeat(item.key === "cvv" ? 3 : 16) : item.value}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {item.sensitive && (
                      <button onClick={item.toggle} className="p-1 text-muted-foreground hover:text-foreground">
                        {item.show ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                    <button onClick={() => copy(item.value, item.label)} className="p-1 text-muted-foreground hover:text-primary">
                      {copied === item.label ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="p-6 text-center text-muted-foreground">Card not found</p>
        )}
      </div>
    </div>
  );
}

export default function Cards() {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const { data: cards, isLoading } = useGetCards();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 max-w-5xl mx-auto px-4 sm:pl-16 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">Virtual Cards</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your saved payment cards</p>
          </div>
          <Link href="/add-card">
            <Button className="bg-primary text-primary-foreground hover:opacity-90" data-testid="button-add-new-card">
              Add New Card
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : !cards || cards.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <CreditCard size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No cards added yet</p>
            <Link href="/add-card">
              <Button className="bg-primary text-primary-foreground hover:opacity-90" data-testid="button-add-first-card">
                Add Your First Card
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {cards.map((card: any) => (
              <div key={card.id} data-testid={`card-virtual-${card.id}`} className="virtual-card h-52 p-6 flex flex-col justify-between text-white relative group">
                <div className="flex justify-between items-start">
                  <CreditCard size={26} className="text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-xs tracking-widest">GOLDMAILER</span>
                </div>
                <div>
                  <p className="font-mono tracking-widest text-lg mb-3">{maskCard(card.lastFour.padStart(16, "0"))}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-white/50 uppercase mb-1">Cardholder</p>
                      <p className="font-semibold uppercase text-sm">{card.cardholderName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50 uppercase mb-1">Expires</p>
                      <p className="font-semibold text-sm">{card.expiryDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-white/50">{card.billingCity}, {card.billingCountry}</span>
                    <Button
                      size="sm"
                      onClick={() => setSelectedCardId(card.id)}
                      data-testid={`button-view-card-${card.id}`}
                      className="bg-white/20 hover:bg-white/30 text-white text-xs border-0 backdrop-blur-sm"
                    >
                      <Eye size={12} className="mr-1" /> View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedCardId !== null && (
        <CardDetailModal cardId={selectedCardId} onClose={() => setSelectedCardId(null)} />
      )}
    </div>
  );
}
