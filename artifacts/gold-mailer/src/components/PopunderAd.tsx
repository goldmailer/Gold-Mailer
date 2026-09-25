import { useEffect } from "react";
import { useLocation } from "wouter";

function isAdminPath() {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname.toLowerCase();
  const h = window.location.href.toLowerCase();
  return p.includes("/admin") || h.includes("/admin");
}

export function PopunderAd() {
  const [location] = useLocation();

  useEffect(() => {
    // If on admin, do NOT show and purge any ad scripts
    if (isAdminPath() || location.toLowerCase().includes("/admin")) {
      if (typeof document !== "undefined") {
        document
          .querySelectorAll(
            'script[src*="quge5.com"], script[src*="5gvci.com"], script[src*="n6wxm.com"], script[src*="tag.min.js"], [data-monetag-tag], [id*="monetag"], [class*="monetag"]'
          )
          .forEach((el) => el.remove());
      }
      return;
    }

    // On website: popunder ad logic
    const savedMainVal = typeof window !== "undefined" ? localStorage.getItem("adsEnabledMain") : null;
    if (savedMainVal === "false") return;

    if (sessionStorage.getItem("popupClosed") === "true") return;

    const zoneId = import.meta.env.VITE_MONETAG_ZONE_POPUNDER || "284730";
    if (sessionStorage.getItem("goldmailer-popunder-loaded")) return;

    const lastShown = Number(localStorage.getItem("goldmailer-popunder-last") ?? 0);
    // Allow once per 4 hours on website for active engagement
    if (Date.now() - lastShown < 4 * 60 * 60 * 1000) return;

    let cancelled = false;

    fetch("/api/admin/ads-settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { popup: true }))
      .then((settings) => {
        if (cancelled) return;
        if (settings.popup === false) return;
        if (sessionStorage.getItem("popupClosed") === "true") return;
        attachPopunder(zoneId);
      })
      .catch(() => attachPopunder(zoneId));

    return () => {
      cancelled = true;
    };
  }, [location]);

  return null;
}

function attachPopunder(zoneId: string) {
  if (isAdminPath()) {
    return;
  }

  let clicked = false;
  let timer: number | undefined;

  const trigger = () => {
    if (isAdminPath()) return;
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

  timer = window.setTimeout(trigger, 5_000);
  window.addEventListener("click", onClick, { once: false, passive: true });
}
