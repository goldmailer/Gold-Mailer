import { useEffect } from "react";
import { useLocation } from "wouter";

// Monetag tags configured to display across public website pages
const DEFAULT_PUBLIC_TAGS = [
  {
    tag_slot: "Tag 1",
    tag_code: '<script src="https://quge5.com/88/tag.min.js" data-zone="284730" async data-cfasync="false"></script>',
  },
  {
    tag_slot: "Tag 2",
    tag_code: '<script src="https://quge5.com/88/tag.min.js" data-zone="284203" async data-cfasync="false"></script>',
  },
  {
    tag_slot: "Tag 3",
    tag_code: '<script src="https://n6wxm.com/88/tag.min.js" data-zone="284731" async data-cfasync="false"></script>',
  },
  {
    tag_slot: "Tag 4",
    tag_code: '<script src="https://quge5.com/88/tag.min.js" data-zone="284209" async data-cfasync="false"></script>',
  },
];

/**
 * AdTagLoader: Injects Monetag ads on public website pages ONLY.
 * Ads are STRICTLY BLOCKED and purged on all /admin paths.
 */
export function AdTagLoader() {
  const [location] = useLocation();

  const isAdmin =
    location.toLowerCase().includes("/admin") ||
    (typeof window !== "undefined" &&
      (window.location.pathname.toLowerCase().includes("/admin") ||
        window.location.href.toLowerCase().includes("/admin")));

  useEffect(() => {
    // If user is on ANY admin path, remove all ad tags immediately and do not load any ads
    if (isAdmin) {
      if (typeof document !== "undefined") {
        document
          .querySelectorAll(
            'script[src*="quge5.com"], script[src*="5gvci.com"], script[src*="n6wxm.com"], script[src*="tag.min.js"], [data-monetag-tag], [id*="monetag"], [class*="monetag"]'
          )
          .forEach((el) => el.remove());
      }
      return;
    }

    // On the public website, ensure ads are loaded
    let isMounted = true;

    function injectTags(tags: Array<{ tag_slot: string; tag_code: string }>) {
      if (
        !isMounted ||
        window.location.pathname.toLowerCase().includes("/admin") ||
        window.location.href.toLowerCase().includes("/admin")
      ) {
        return;
      }

      // Avoid duplicate injections
      const existing = document.querySelectorAll("[data-monetag-tag]");
      if (existing.length > 0) return;

      tags.forEach((tag) => {
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
    }

    async function loadActiveTags() {
      try {
        const res = await fetch("/api/ad-tags/active");
        if (res.ok) {
          const tags = await res.json();
          if (Array.isArray(tags) && tags.length > 0 && isMounted) {
            injectTags(tags);
            return;
          }
        }
      } catch (err) {
        // Fallback to default tags below
      }

      // If API returned empty or failed, fallback to default public tags so website always has ads
      if (isMounted) {
        injectTags(DEFAULT_PUBLIC_TAGS);
      }
    }

    loadActiveTags();

    return () => {
      isMounted = false;
    };
  }, [location, isAdmin]);

  return null;
}
