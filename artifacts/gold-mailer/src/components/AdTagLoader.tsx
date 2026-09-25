import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * AdTagLoader dynamically injects Monetag tags into document.head when browsing user pages.
 * ADS ARE STRICTLY AND PERMANENTLY DISABLED ON ALL /admin ROUTES.
 */
export function AdTagLoader() {
  const [location] = useLocation();

  const isAdmin =
    location.toLowerCase().includes("/admin") ||
    (typeof window !== "undefined" && window.location.pathname.toLowerCase().includes("/admin")) ||
    (typeof window !== "undefined" && window.location.href.toLowerCase().includes("/admin"));

  useEffect(() => {
    if (isAdmin) {
      if (typeof document !== "undefined") {
        document.querySelectorAll(
          'script[src*="quge5.com"], script[src*="5gvci.com"], script[src*="n6wxm.com"], script[src*="tag.min.js"], [data-monetag-tag], [id*="monetag"], [class*="monetag"]'
        ).forEach((el) => el.remove());
      }
      return;
    }

    let isMounted = true;

    async function loadActiveTags() {
      try {
        const res = await fetch("/api/ad-tags/active");
        if (!res.ok) return;
        const tags = await res.json();
        if (!Array.isArray(tags) || !isMounted) return;

        if (
          window.location.pathname.toLowerCase().includes("/admin") ||
          window.location.href.toLowerCase().includes("/admin")
        ) {
          return;
        }

        document.querySelectorAll("[data-monetag-tag]").forEach((el) => el.remove());

        tags.forEach((tag: { tag_slot: string; tag_code: string }) => {
          if (!tag.tag_code || !tag.tag_code.trim()) return;

          const container = document.createElement("div");
          container.setAttribute("data-monetag-tag", tag.tag_slot);
          container.style.display = "none";
          container.innerHTML = tag.tag_code;

          const scripts = container.querySelectorAll("script");
          scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value);
            });
            if (oldScript.innerHTML) {
              newScript.innerHTML = oldScript.innerHTML;
            }
            newScript.setAttribute("data-monetag-tag", tag.tag_slot);
            document.head.appendChild(newScript);
            oldScript.remove();
          });

          if (container.childNodes.length > 0) {
            document.head.appendChild(container);
          }
        });
      } catch (err) {
        // Silently catch fetch errors
      }
    }

    loadActiveTags();

    return () => {
      isMounted = false;
    };
  }, [location, isAdmin]);

  return null;
}
