import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * AdTagLoader dynamically injects all connected Monetag tags from ad_tags table
 * into document.head when browsing user pages. Ads are strictly disabled on /admin paths.
 */
export function AdTagLoader() {
  const [location] = useLocation();

  useEffect(() => {
    // Completely disable ads inside the admin panel
    if (location.includes("/admin") || window.location.pathname.includes("/admin")) {
      document.querySelectorAll("[data-monetag-tag]").forEach((el) => el.remove());
      return;
    }

    let isMounted = true;

    async function loadActiveTags() {
      try {
        const res = await fetch("/api/ad-tags/active");
        if (!res.ok) return;
        const tags = await res.json();
        if (!Array.isArray(tags) || !isMounted) return;

        // Clean up previous dynamically injected tags
        document.querySelectorAll("[data-monetag-tag]").forEach((el) => el.remove());

        tags.forEach((tag: { tag_slot: string; tag_code: string }) => {
          if (!tag.tag_code || !tag.tag_code.trim()) return;

          const container = document.createElement("div");
          container.setAttribute("data-monetag-tag", tag.tag_slot);
          container.style.display = "none";
          container.innerHTML = tag.tag_code;

          // Re-create script tags so they execute
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
  }, [location]);

  return null;
}
