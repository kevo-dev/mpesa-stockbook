import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.tint,
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: tabBarHeight, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
    }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <MaterialIcons size={25} name="home" color={color} /> }} />
      <Tabs.Screen name="sales" options={{ title: "Sales", tabBarIcon: ({ color }) => <MaterialIcons size={25} name="receipt-long" color={color} /> }} />
      <Tabs.Screen name="products" options={{ title: "Products", tabBarIcon: ({ color }) => <MaterialIcons size={25} name="inventory-2" color={color} /> }} />
      <Tabs.Screen name="reports" options={{ title: "Reports", tabBarIcon: ({ color }) => <MaterialIcons size={25} name="bar-chart" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <MaterialIcons size={25} name="more-horiz" color={color} /> }} />
    </Tabs>
  );
}
