import * as Auth from "@/lib/_core/auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Card, KeyValue, LoadingScreen, PrimaryButton, Screen, SectionTitle, TopBar } from "@/components/stockbook/ui";
import { getApiBaseUrl } from "@/constants/oauth";
import { useColors } from "@/hooks/use-colors";
import { useStockbook } from "@/lib/stockbook/store";
import type { MpesaImportRow } from "@/lib/stockbook/types";

type ConnectionStatus = { configured: boolean; missing: string[]; shortCodeHint?: string; syncWindowHours: number; source: string };
type SyncResponse = { transactions: MpesaImportRow[]; syncedAt: string; windowStart: string; windowEnd: string };

export default function MpesaLiveScreen() {
  const { ready, importMpesa } = useStockbook();
  const colors = useColors();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/mpesa/status`);
      if (!response.ok) throw new Error("Connection status is temporarily unavailable.");
      setStatus(await response.json() as ConnectionStatus);
    } catch (error) {
      Alert.alert("Could not check live sync", error instanceof Error ? error.message : "Try again when you are connected.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);
  if (!ready) return <LoadingScreen />;

  const sync = async () => {
    if (!status?.configured) return;
    const token = await Auth.getSessionToken();
    if (!token) {
      Alert.alert("Secure session required", "Live M-Pesa statement data is protected. Open this feature from a signed-in workspace session after your Daraja connection has been approved.");
      return;
    }
    try {
      setSyncing(true);
      const response = await fetch(`${getApiBaseUrl()}/api/mpesa/sync`, { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      const body = await response.json() as SyncResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Live sync could not be completed.");
      const result = importMpesa(body.transactions);
      setLastSync(body.syncedAt);
      Alert.alert("Live sync complete", `${result.imported} transaction${result.imported === 1 ? "" : "s"} added. ${result.duplicates} duplicate${result.duplicates === 1 ? " was" : "s were"} skipped.`);
    } catch (error) {
      Alert.alert("Live sync could not finish", error instanceof Error ? error.message : "Try again after checking the Daraja connection.");
    } finally { setSyncing(false); }
  };

  return <Screen><TopBar title="M-Pesa Live Sync" subtitle="Official Daraja Pull Transactions" onBack={() => router.back()} /><Card style={[styles.hero, { backgroundColor: status?.configured ? `${colors.success}16` : `${colors.warning}18`, borderColor: status?.configured ? `${colors.success}55` : `${colors.warning}55` }]}><View style={styles.heroLine}><View style={[styles.icon, { backgroundColor: status?.configured ? `${colors.success}24` : `${colors.warning}24` }]}><MaterialIcons name={status?.configured ? "verified" : "lock-outline"} size={24} color={status?.configured ? colors.success : colors.warning} /></View><View style={{ flex: 1 }}><Text style={[styles.heroTitle, { color: colors.text }]}>{loading ? "Checking connection…" : status?.configured ? "Ready for secure sync" : "Setup pending"}</Text><Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 }}>{loading ? "Reading server readiness without exposing business credentials." : status?.configured ? "The approved business connection can retrieve recent C2B transactions." : "Enter official Daraja credentials later to enable this connection."}</Text></View></View></Card>{loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View> : <><SectionTitle title="Connection details" /><Card><KeyValue label="Data source" value={status?.source || "Unavailable"} /><KeyValue label="Shortcode" value={status?.shortCodeHint || "Not configured"} /><KeyValue label="Sync window" value={`Latest ${status?.syncWindowHours || 48} hours`} />{lastSync ? <KeyValue label="Last synced" value={new Date(lastSync).toLocaleString("en-KE")} /> : null}</Card><SectionTitle title="Sync safely" /><Card><Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>What this connection does</Text><Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }}>It requests recent approved C2B business transactions from Safaricom Daraja, then uses the same duplicate checks and matching queue as CSV imports. It does not initiate payments, access a personal wallet, or store Daraja keys on this phone.</Text><PrimaryButton label={syncing ? "Syncing latest transactions…" : status?.configured ? "Sync latest 48 hours" : "Live sync unavailable"} icon={syncing ? "sync" : "cloud-sync"} disabled={!status?.configured || syncing} onPress={() => void sync()} /></Card><SectionTitle title="Before activation" /><Card><Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>Official business setup required</Text><Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }}>Use a live PayBill or Till that has the official C2B and Pull Transactions approvals. When you receive the Consumer Key, Consumer Secret, Shortcode, nominated MSISDN, and official Daraja token/query URLs, add them through the secure project settings. Keep using CSV import until then.</Text>{status && !status.configured ? <Text style={{ color: colors.warning, fontWeight: "700", fontSize: 12, lineHeight: 18, marginTop: 10 }}>{status.missing.length} server configuration value{status.missing.length === 1 ? " is" : "s are"} still missing. No payment data can be retrieved yet.</Text> : null}</Card><Card style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="info-outline" size={19} color={colors.primary} /><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, flex: 1 }}>M-Pesa StockBook is independent and not affiliated with Safaricom. Estimated profit and local reporting remain decision-support tools, not formal accounting.</Text></Card></>}</Screen>;
}

const styles = StyleSheet.create({ hero: { padding: 16 }, heroLine: { flexDirection: "row", gap: 12, alignItems: "center" }, icon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" }, heroTitle: { fontSize: 16, fontWeight: "800" }, center: { minHeight: 100, alignItems: "center", justifyContent: "center" }, note: { flexDirection: "row", gap: 9, alignItems: "flex-start", marginTop: 18 } });
