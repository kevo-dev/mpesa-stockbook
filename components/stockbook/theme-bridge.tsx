import { useEffect, type ReactNode } from "react";
import { useThemeContext } from "@/lib/theme-provider";
import { useStockbook } from "@/lib/stockbook/store";

export function StockbookThemeBridge({ children }: { children: ReactNode }) {
  const { state, ready } = useStockbook();
  const { setColorScheme } = useThemeContext();
  useEffect(() => {
    if (ready) setColorScheme(state.settings.colorScheme);
  }, [ready, setColorScheme, state.settings.colorScheme]);
  return <>{children}</>;
}
