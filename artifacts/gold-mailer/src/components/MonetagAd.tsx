import { useEffect, useRef } from "react";

type Props = {
  zoneId?: string;
  label?: string;
  size?: "leaderboard" | "sidebar" | "fluid";
};

export function MonetagAd({ zoneId, label = "Sponsored", size = "fluid" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!zoneId || !ref.current) return;
    const script = document.createElement("script");
    script.async = true;
    script.dataset.zone = zoneId;
    script.src = `https://fpyf8.com/88/tag.min.js?z=${encodeURIComponent(zoneId)}`;
    ref.current.appendChild(script);
    return () => script.remove();
  }, [zoneId]);

  const sizeClass = size === "leaderboard" ? "min-h-[90px] max-w-[728px]" : size === "sidebar" ? "min-h-[250px] max-w-[300px]" : "min-h-[90px]";
  return (
    <div ref={ref} className={`w-full ${sizeClass} rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center overflow-hidden`} aria-label={label}>
      {!zoneId ? <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/50">{label}</span> : null}
    </div>
  );
}