import { PopunderAd } from "./PopunderAd";

export function PopupAd() {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.includes('/admin');
  if (isAdmin) return null;
  if (typeof window !== 'undefined' && sessionStorage.getItem('popupClosed') === 'true') return null;

  const savedMain = typeof window !== 'undefined' ? localStorage.getItem('adsEnabledMain') : null;
  if (savedMain === 'false') return null;

  return <PopunderAd />;
}

export default PopupAd;
