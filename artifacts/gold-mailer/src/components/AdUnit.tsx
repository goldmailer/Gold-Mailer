import { useEffect, useRef, useState } from "react";

export type AdPlacement = "heroPage" | "dashboard" | "withdrawPage" | "general" | "sidebar";

type Props = {
  placement: AdPlacement;
  zoneId?: string;
  label?: string;
  size?: "leaderboard" | "sidebar" | "fluid";
};

type AdsSettings = Record<`${AdPlacement}AdsEnabled`, boolean>;

const defaultAdsSettings: AdsSettings = {
  heroPageAdsEnabled: true,
  dashboardAdsEnabled: true,
  withdrawPageAdsEnabled: true,
  generalAdsEnabled: true,
  sidebarAdsEnabled: true,
};

const settingForPlacement: Record<AdPlacement, keyof AdsSettings> = {
  heroPage: "heroPageAdsEnabled",
  dashboard: "dashboardAdsEnabled",
  withdrawPage: "withdrawPageAdsEnabled",
  general: "generalAdsEnabled",
  sidebar: "sidebarAdsEnabled",
};

let settingsPromise: Promise<AdsSettings> | null = null;
let settingsCachedAt = 0;

// Master ad switches (main banner + popup) fetched from /admin/ads-settings.
let masterPromise: Promise<{ main: boolean; popup: boolean }> | null = null;
let masterCachedAt = 0;

function isAdminPath() {
  return window.location.pathname.includes("/admin");
}

function loadMasterAdsSettings() {
  if (!masterPromise || Date.now() - masterCachedAt > 30_000) {
    masterCachedAt = Date.now();
    masterPromise = fetch("/api/admin/ads-settings", { credentials: "include" })
      .then((r) => r.ok ? r.json() : { main: true, popup: true })
      .catch(() => ({ main: true, popup: true }));
  }
  return masterPromise;
}

export function resetMasterAdsCache() {
  masterPromise = null;
  masterCachedAt = 0;
}

function removeMonetagScripts() {
  document.querySelectorAll('script[src*="quge5.com/88/tag.min.js"]').forEach((script) => script.remove());
}

function loadAdsSettings() {
  if (!settingsPromise || Date.now() - settingsCachedAt > 30_000) {
    settingsCachedAt = Date.now();
    settingsPromise = fetch("/api/settings/ads", { credentials: "include" })
      .then((response) => response.ok ? response.json() : {})
      .then((data) => data as AdsSettings)
      .catch(() => defaultAdsSettings);
  }
  return settingsPromise;
}

export function resetAdsSettingsCache() {
  settingsPromise = null;
  settingsCachedAt = 0;
}

export function AdUnit({ placement, zoneId, label = "Sponsored", size = "fluid" }: Props) {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.includes('/admin');
  if (isAdmin) return null;

  const savedMainCheck = typeof window !== 'undefined' ? localStorage.getItem('adsEnabledMain') : null;
  if (savedMainCheck === 'false') return null;

  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) return;
    const savedMain = typeof window !== 'undefined' ? localStorage.getItem('adsEnabledMain') : null;
    if (savedMain === 'false') return;

    let active = true;
    if (isAdminPath()) {
      removeMonetagScripts();
      return () => { active = false; };
    }
    // Master "Main Banner Ads" switch must be ON, then the per-placement setting applies.
    Promise.all([loadMasterAdsSettings(), loadAdsSettings()]).then(([master, settings]) => {
      if (active) {
        const placementOn = Boolean(settings[settingForPlacement[placement]]);
        setEnabled(Boolean(master.main) && placementOn);
        setChecked(true);
      }
    });
    return () => { active = false; };
  }, [placement]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) return;
    const savedMain = typeof window !== 'undefined' ? localStorage.getItem('adsEnabledMain') : null;
    if (savedMain === 'false') return;

    if (!checked || !enabled || !zoneId || !ref.current) return;
    const script = document.createElement("script");
    script.id = `monetag-zone-${placement}-${zoneId}`;
    script.async = true;
    script.dataset.zone = zoneId;
    script.dataset.cfasync = "false";
    script.src = "https://quge5.com/88/tag.min.js";
    ref.current.appendChild(script);
    return () => script.remove();
  }, [checked, enabled, placement, zoneId]);

  if (isAdmin || isAdminPath() || !checked || !enabled || !zoneId) return null;
  const sizeClass = size === "leaderboard" ? "min-h-[90px] max-w-[728px]" : size === "sidebar" ? "min-h-[250px] max-w-[300px]" : "min-h-[90px]";
  return (
    <div ref={ref} className={`min-w-0 w-full max-w-full ${sizeClass} rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center overflow-hidden`} aria-label={label}>
      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/50">{label}</span>
    </div>
  );
}