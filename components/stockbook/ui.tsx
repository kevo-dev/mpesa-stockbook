import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { formatKes } from "@/lib/stockbook/calculations";

type ButtonProps = { label: string; onPress: () => void; icon?: React.ComponentProps<typeof MaterialIcons>["name"]; disabled?: boolean; full?: boolean; tone?: "primary" | "danger" | "quiet" };

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const colors = useColors();
  const content = <View style={[styles.screen, { backgroundColor: colors.background }]}>{children}</View>;
  return <ScreenContainer><KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{content}</ScrollView> : content}</KeyboardAvoidingView></ScreenContainer>;
}

export function TopBar({ title, subtitle, onBack, action }: { title: string; subtitle?: string; onBack?: () => void; action?: ReactNode }) {
  const colors = useColors();
  return <View style={styles.topBar}><View style={styles.topTitle}>{onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={({ pressed }) => [styles.backButton, { backgroundColor: colors.surface, opacity: pressed ? 0.65 : 1 }]}><MaterialIcons name="arrow-back" size={21} color={colors.text} /></Pressable> : null}<View><Text style={[styles.title, { color: colors.text }]}>{title}</Text>{subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}</View></View>{action}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

export function MetricCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "warning" }) {
  const colors = useColors();
  const valueColor = tone === "positive" ? colors.success : tone === "warning" ? colors.warning : colors.text;
  return <Card style={styles.metricCard}><Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.metricValue, { color: valueColor }]} numberOfLines={1}>{value}</Text></Card>;
}

export function PrimaryButton({ label, onPress, icon, disabled, full = true, tone = "primary" }: ButtonProps) {
  const colors = useColors();
  const background = tone === "danger" ? colors.error : tone === "quiet" ? colors.surface : colors.primary;
  const foreground = tone === "quiet" ? colors.text : "#FFFFFF";
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, !full && styles.inlineButton, { backgroundColor: background, borderColor: tone === "quiet" ? colors.border : background, opacity: disabled ? 0.48 : pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><View style={styles.buttonContent}>{icon ? <MaterialIcons name={icon} color={foreground} size={19} /> : null}<Text style={[styles.buttonText, { color: foreground }]}>{label}</Text></View></Pressable>;
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.surface, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.chipText, { color: selected ? "#FFFFFF" : colors.text }]}>{label}</Text></Pressable>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, helper }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "numeric" | "phone-pad"; multiline?: boolean; helper?: string }) {
  const colors = useColors();
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} style={[styles.input, multiline && styles.multiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} returnKeyType="done" />{helper ? <Text style={[styles.helper, { color: colors.muted }]}>{helper}</Text> : null}</View>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}><Text style={[styles.sectionText, { color: colors.text }]}>{title}</Text>{action}</View>;
}

export function EmptyState({ icon, title, detail, action }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; detail: string; action?: ReactNode }) {
  const colors = useColors();
  return <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.surface }]}><View style={[styles.emptyIcon, { backgroundColor: colors.background }]}><MaterialIcons name={icon} size={28} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.emptyDetail, { color: colors.muted }]}>{detail}</Text>{action ? <View style={styles.emptyAction}>{action}</View> : null}</View>;
}

export function LoadingScreen() {
  const colors = useColors();
  return <Screen scroll={false}><View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, { color: colors.muted }]}>Opening your stockbook…</Text></View></Screen>;
}

export function KeyValue({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const colors = useColors();
  return <View style={styles.keyValue}><Text style={[styles.keyLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.keyValueText, { color: positive === true ? colors.success : positive === false ? colors.error : colors.text }]}>{value}</Text></View>;
}

export function Money({ value, positive }: { value: number; positive?: boolean }) {
  const colors = useColors();
  return <Text style={{ color: positive === true ? colors.success : positive === false ? colors.error : colors.text, fontWeight: "800" }}>{formatKes(value)}</Text>;
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 }, scroll: { flexGrow: 1 }, screen: { flex: 1, paddingHorizontal: 18, paddingBottom: 28 }, topBar: { paddingTop: 10, paddingBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, topTitle: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }, backButton: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" }, title: { fontSize: 25, lineHeight: 31, fontWeight: "800", letterSpacing: -0.45 }, subtitle: { fontSize: 13, marginTop: 2 }, card: { borderWidth: 1, borderRadius: 18, padding: 15, shadowColor: "#172B25", shadowOpacity: 0.035, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }, metricCard: { minHeight: 93, flex: 1 }, metricLabel: { fontSize: 12, fontWeight: "600", marginBottom: 9 }, metricValue: { fontSize: 20, lineHeight: 25, fontWeight: "800", letterSpacing: -0.35 }, button: { minHeight: 50, borderRadius: 15, borderWidth: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, marginTop: 10 }, inlineButton: { alignSelf: "flex-start" }, buttonContent: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" }, buttonText: { fontSize: 15, fontWeight: "800" }, chip: { borderWidth: 1, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18 }, chipText: { fontSize: 13, fontWeight: "700" }, field: { marginBottom: 14 }, fieldLabel: { fontSize: 13, fontWeight: "700", marginBottom: 7 }, input: { minHeight: 49, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 15 }, multiline: { minHeight: 92, paddingTop: 12 }, helper: { marginTop: 5, fontSize: 12, lineHeight: 17 }, sectionTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 10 }, sectionText: { fontSize: 17, fontWeight: "800" }, empty: { padding: 24, borderRadius: 18, alignItems: "center", marginTop: 6 }, emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", marginBottom: 12 }, emptyTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" }, emptyDetail: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 6, maxWidth: 280 }, emptyAction: { marginTop: 4 }, loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }, loadingText: { fontSize: 14 }, keyValue: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, gap: 12 }, keyLabel: { fontSize: 14 }, keyValueText: { fontSize: 14, fontWeight: "700", textAlign: "right", flexShrink: 1 },
});
