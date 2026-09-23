import { AdUnit, type AdPlacement } from "@/components/AdUnit";

type Props = {
  zoneId?: string;
  label?: string;
  size?: "leaderboard" | "sidebar" | "fluid";
  placement?: AdPlacement;
};

// Backwards-compatible wrapper for existing callers. New placements should use AdUnit directly.
export function MonetagAd({ placement = "general", ...props }: Props) {
  return <AdUnit placement={placement} {...props} />;
}