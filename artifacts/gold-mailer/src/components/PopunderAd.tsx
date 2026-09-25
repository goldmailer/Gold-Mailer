import { useEffect } from "react";
import { useLocation } from "wouter";

export function PopunderAd() {
  const [location] = useLocation();
  useEffect(() => {
    const adminPath = location.includes("/admin");
    if (adminPath) {
      document.querySelectorAll('script[src*="quge5.com/88/tag.min.js"]').forEach((script) => script.remove());
      return;
    }
    // Respect the "Popup Ads" master switch and a per-session dismissal.
    if (sessionStorage.getItem("popupClosed") === "true") return;

    const zoneId = import.meta.env.VITE_MONETAG_ZONE_POPUNDER;
    if (!zoneId || sessionStorage.getItem("goldmailer-popunder-loaded")) return;
    const lastShown = Number(localStorage.getItem("goldmailer-popunder-last") ?? 0);
    if (Date.now() - lastShown < 24 * 60 * 60 * 1000) return;

    let cancelled = false;
    // Fetch the master popup switch before doing anything.
    fetch("/api/admin/ads-settings", { credentials: "include" })
      .then((r) => r.ok ? r.json() : { popup: true })
      .then((settings) => {
        if (cancelled) return;
        if (settings.popup === false) return;
        if (sessionStorage.getItem("popupClosed") === "true") return;
        attachPopunder(zoneId);
      })
      .catch(() => attachPopunder(zoneId));

    return () => { cancelled = true; };
  }, [location]);

  return null;
}

function attachPopunder(zoneId: string) {
  let clicked = false;
  let timer: number | undefined;
  const trigger = () => {
    if (!clicked || sessionStorage.getItem("goldmailer-popunder-loaded")) return;
    if (sessionStorage.getItem("popupClosed") === "true") return;
    sessionStorage.setItem("goldmailer-popunder-loaded", "1");
    localStorage.setItem("goldmailer-popunder-last", String(Date.now()));
    const script = document.createElement("script");
    script.async = true;
    script.dataset.zone = zoneId;
    script.dataset.cfasync = "false";
    script.src = "https://quge5.com/88/tag.min.js";
    document.body.appendChild(script);
    window.removeEventListener("click", onClick);
    if (timer) window.clearTimeout(timer);
  };
  const onClick = () => {
    clicked = true;
    trigger();
  };
  timer = window.setTimeout(trigger, 10_000);
  window.addEventListener("click", onClick, { once: false, passive: true });
}
