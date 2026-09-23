import { useEffect } from "react";
import { useLocation } from "wouter";

export function PopunderAd() {
  const [location] = useLocation();
  useEffect(() => {
    const adminPath = location === "/admin" || location.startsWith("/admin/");
    if (adminPath) {
      document.querySelectorAll('script[src*="quge5.com/88/tag.min.js"]').forEach((script) => script.remove());
      return;
    }
    const zoneId = import.meta.env.VITE_MONETAG_ZONE_POPUNDER;
    if (!zoneId || sessionStorage.getItem("goldmailer-popunder-loaded")) return;
    const lastShown = Number(localStorage.getItem("goldmailer-popunder-last") ?? 0);
    if (Date.now() - lastShown < 24 * 60 * 60 * 1000) return;

    let clicked = false;
    let timer: number | undefined;
    const trigger = () => {
      if (!clicked || sessionStorage.getItem("goldmailer-popunder-loaded")) return;
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
    return () => {
      window.removeEventListener("click", onClick);
      if (timer) window.clearTimeout(timer);
    };
  }, [location]);

  return null;
}