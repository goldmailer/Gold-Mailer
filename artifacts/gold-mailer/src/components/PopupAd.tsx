import { PopunderAd } from "./PopunderAd";

export function PopupAd() {
  const isAdmin =
    typeof window !== "undefined" &&
    (window.location.pathname.toLowerCase().includes("/admin") ||
      window.location.href.toLowerCase().includes("/admin"));

  if (isAdmin) return null;

  return <PopunderAd />;
}

export default PopupAd;
