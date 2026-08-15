import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { StockbookThemeBridge } from "@/components/stockbook/theme-bridge";
import { StockbookProvider } from "@/lib/stockbook/store";
import { subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;
  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    return subscribeSafeAreaInsets(handleSafeAreaUpdate);
  }, [handleSafeAreaUpdate]);

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: { ...metrics.insets, top: Math.max(metrics.insets.top, 16), bottom: Math.max(metrics.insets.bottom, 12) },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="product-form" options={{ presentation: "modal" }} />
        <Stack.Screen name="stock-adjust" options={{ presentation: "modal" }} />
        <Stack.Screen name="sale" options={{ presentation: "modal" }} />
        <Stack.Screen name="expense-form" options={{ presentation: "modal" }} />
        <Stack.Screen name="expenses" />
        <Stack.Screen name="transactions" />
        <Stack.Screen name="transaction-details" />
        <Stack.Screen name="credit" />
        <Stack.Screen name="customer" options={{ presentation: "modal" }} />
        <Stack.Screen name="mpesa-import" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="help" />
        <Stack.Screen name="upgrade" options={{ presentation: "modal" }} />
        <Stack.Screen name="closing-summary" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );

  const app = (
    <ThemeProvider>
      <StockbookProvider>
        <StockbookThemeBridge>{content}</StockbookThemeBridge>
      </StockbookProvider>
    </ThemeProvider>
  );

  if (Platform.OS === "web") {
    return (
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={insets}>{app}</SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      </SafeAreaProvider>
    );
  }

  return <SafeAreaProvider initialMetrics={providerInitialMetrics}>{app}</SafeAreaProvider>;
}
