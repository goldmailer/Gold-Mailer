import { AdUnit, type AdPlacement } from "@/components/AdUnit";

type Props = {
  zoneId?: string;
  label?: string;
  size?: "leaderboard" | "sidebar" | "fluid";
  placement?: AdPlacement;
};

export function MonetagAd({ placement = "general", ...props }: Props) {
  const isAdmin =
    typeof window !== "undefined" &&
    (window.location.pathname.toLowerCase().includes("/admin") ||
      window.location.href.toLowerCase().includes("/admin"));

  if (isAdmin) return null;

  return <AdUnit placement={placement} {...props} />;
}

export default MonetagAd;
