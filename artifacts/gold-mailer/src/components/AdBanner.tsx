import { AdUnit, type AdPlacement } from "./AdUnit";

type Props = {
  placement?: AdPlacement;
  zoneId?: string;
  label?: string;
  size?: "leaderboard" | "sidebar" | "fluid";
};

export function AdBanner({ placement = "general", ...props }: Props) {
  const isAdmin =
    typeof window !== "undefined" &&
    (window.location.pathname.toLowerCase().includes("/admin") ||
      window.location.href.toLowerCase().includes("/admin"));

  if (isAdmin) return null;

  return <AdUnit placement={placement} {...props} />;
}

export default AdBanner;
