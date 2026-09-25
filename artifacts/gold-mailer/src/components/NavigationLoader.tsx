import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * NavigationLoader: Purges any stray ads when navigating to or residing on any admin page.
 */
export function NavigationLoader() {
  const [location] = useLocation();

  useEffect(() => {
    const isAdmin =
      location.toLowerCase().includes("/admin") ||
      (typeof window !== "undefined" && window.location.pathname.toLowerCase().includes("/admin")) ||
      (typeof window !== "undefined" && window.location.href.toLowerCase().includes("/admin"));

    if (isAdmin && typeof document !== "undefined") {
      document.querySelectorAll(
        'script[src*="quge5.com"], script[src*="5gvci.com"], script[src*="n6wxm.com"], script[src*="tag.min.js"], [data-monetag-tag], [id*="monetag"], [class*="monetag"]'
      ).forEach((el) => el.remove());
    }
  }, [location]);

  return null;
}
