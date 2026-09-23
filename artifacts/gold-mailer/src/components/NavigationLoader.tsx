import { useEffect, useState } from "react";

export function NavigationLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest("a, button, [role='button'], select");
      if (!interactive || interactive.hasAttribute("data-no-loader") || interactive.getAttribute("aria-disabled") === "true") return;
      setVisible(true);
      window.setTimeout(() => setVisible(false), 700);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/35 backdrop-blur-[2px]" aria-live="polite" aria-label="Loading">
      <div className="gmt-loader" role="status">
        <span className="gmt-loader-label">GMT</span>
        <span className="gmt-loader-orbit"><span className="gmt-loader-ball" /></span>
      </div>
    </div>
  );
}