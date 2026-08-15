import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Field, PrimaryButton, Screen } from "@/components/stockbook/ui";
import { useColors } from "@/hooks/use-colors";
import { useStockbook } from "@/lib/stockbook/store";

const slides = [
  { icon: "storefront" as const, title: "Run your shop with confidence", detail: "Track sales, stock, expenses, and profit in one simple app." },
  { icon: "cloud-off" as const, title: "Works offline", detail: "Record transactions even when mobile data is unavailable." },
  { icon: "insights" as const, title: "Know your daily numbers", detail: "See what you sold, spent, and earned before closing." },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const { saveProfile, useDemoData } = useStockbook();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Kiosk");
  const [ownerName, setOwnerName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const slide = slides[step];
  const goHome = () => router.replace("/");
  const handleSave = () => {
    if (!businessName.trim()) { Alert.alert("Add your business name", "This helps personalize your daily summary."); return; }
    const balance = Number(openingBalance || 0);
    if (!Number.isFinite(balance) || balance < 0) { Alert.alert("Check opening cash", "Use a number that is zero or greater."); return; }
    saveProfile({ businessName: businessName.trim(), businessType: businessType.trim() || "Small business", ownerName: ownerName.trim() || undefined, mpesaNumber: mpesaNumber.trim() || undefined, defaultOpeningBalance: balance, language });
    goHome();
  };
  const startDemo = () => { useDemoData(); goHome(); };

  if (step < slides.length) {
    return <Screen scroll={false}><View style={styles.welcome}><View style={styles.welcomeTop}><Pressable onPress={() => setStep(slides.length)} accessibilityRole="button" accessibilityLabel="Skip onboarding" style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.65 : 1 }]}><Text style={{ color: colors.primary, fontWeight: "800" }}>Skip</Text></Pressable><Text style={{ color: colors.muted, fontWeight: "700" }}>{step + 1} of 3</Text></View><View style={[styles.heroIcon, { backgroundColor: `${colors.primary}18` }]}><MaterialIcons name={slide.icon} size={62} color={colors.primary} /></View><View style={styles.slideText}><Text style={[styles.slideTitle, { color: colors.text }]}>{slide.title}</Text><Text style={[styles.slideDetail, { color: colors.muted }]}>{slide.detail}</Text></View><View style={styles.bottom}><View style={styles.dots}>{slides.map((_, index) => <View key={index} style={[styles.dot, { backgroundColor: index === step ? colors.primary : colors.border }]} />)}</View><PrimaryButton label={step === slides.length - 1 ? "Get Started" : "Next"} icon="arrow-forward" onPress={() => setStep(step === slides.length - 1 ? slides.length : step + 1)} /></View></View></Screen>;
  }

  return <Screen><View style={styles.profileHeader}><View style={[styles.smallIcon, { backgroundColor: `${colors.primary}18` }]}><MaterialIcons name="storefront" size={26} color={colors.primary} /></View><Text style={[styles.profileTitle, { color: colors.text }]}>Set up your business</Text><Text style={[styles.profileDetail, { color: colors.muted }]}>These details stay on this device and can be changed later.</Text></View><Field label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="e.g. Mama Asha Kiosk" /><Field label="Business type" value={businessType} onChangeText={setBusinessType} placeholder="Kiosk, salon, boutique…" /><Field label="Owner name (optional)" value={ownerName} onChangeText={setOwnerName} placeholder="Your name" /><Field label="Opening cash balance (optional)" value={openingBalance} onChangeText={setOpeningBalance} placeholder="0" keyboardType="numeric" helper="Use the cash available when you open the shop." /><Field label="M-Pesa till or paybill (optional)" value={mpesaNumber} onChangeText={setMpesaNumber} placeholder="Till or paybill number" keyboardType="numeric" /><Text style={[styles.languageLabel, { color: colors.text }]}>Preferred language</Text><View style={styles.languageRow}>{(["en", "sw"] as const).map((item) => <Pressable key={item} onPress={() => setLanguage(item)} style={({ pressed }) => [styles.language, { backgroundColor: language === item ? colors.primary : colors.surface, borderColor: language === item ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 }]}><Text style={{ color: language === item ? "#FFFFFF" : colors.text, fontWeight: "800" }}>{item === "en" ? "English" : "Swahili (soon)"}</Text></Pressable>)}</View><PrimaryButton label="Save and open StockBook" icon="check-circle" onPress={handleSave} /><Pressable accessibilityRole="button" onPress={startDemo} style={({ pressed }) => [styles.demo, { opacity: pressed ? 0.68 : 1 }]}><Text style={{ color: colors.primary, fontWeight: "800" }}>Try demo data instead</Text><Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 3 }}>You can clear demo data from Settings any time.</Text></Pressable></Screen>;
}

const styles = StyleSheet.create({
  welcome: { flex: 1, paddingHorizontal: 6, paddingVertical: 16, justifyContent: "space-between" }, welcomeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, skip: { minHeight: 44, justifyContent: "center", paddingHorizontal: 7 }, heroIcon: { width: 148, height: 148, borderRadius: 74, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: 30 }, slideText: { alignItems: "center", paddingHorizontal: 16 }, slideTitle: { fontSize: 29, fontWeight: "800", textAlign: "center", lineHeight: 36, letterSpacing: -0.6 }, slideDetail: { fontSize: 16, textAlign: "center", lineHeight: 24, marginTop: 14, maxWidth: 310 }, bottom: { paddingBottom: 8 }, dots: { flexDirection: "row", gap: 7, justifyContent: "center", marginBottom: 12 }, dot: { height: 7, width: 7, borderRadius: 4 }, profileHeader: { paddingTop: 18, paddingBottom: 26 }, smallIcon: { height: 52, width: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 14 }, profileTitle: { fontSize: 27, fontWeight: "800", letterSpacing: -0.5 }, profileDetail: { marginTop: 7, fontSize: 14, lineHeight: 20 }, languageLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 }, languageRow: { flexDirection: "row", gap: 9 }, language: { minHeight: 48, borderWidth: 1, flex: 1, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }, demo: { alignItems: "center", marginTop: 20, minHeight: 52, justifyContent: "center" },
});
