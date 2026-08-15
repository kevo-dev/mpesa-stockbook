import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { Card, Field, PrimaryButton, Screen, TopBar } from "@/components/stockbook/ui";
import { useStockbook } from "@/lib/stockbook/store";
import { useColors } from "@/hooks/use-colors";

export default function StockAdjustScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { state, adjustStock } = useStockbook(); const colors = useColors();
  const product = state.products.find((entry) => entry.id === productId);
  const [change, setChange] = useState(""); const [reason, setReason] = useState("");
  if (!product) return <Screen><TopBar title="Adjust stock" onBack={() => router.back()} /><Text style={{ color: colors.muted }}>This product is no longer available.</Text></Screen>;
  const save = () => { try { adjustStock(product.id, Number(change), reason); router.back(); } catch (error) { Alert.alert("Could not adjust stock", error instanceof Error ? error.message : "Check your adjustment."); } };
  return <Screen><TopBar title="Adjust stock" subtitle={product.name} onBack={() => router.back()} /><Card style={styles.current}><Text style={{ color: colors.muted, fontSize: 13 }}>Current quantity</Text><Text style={[styles.currentValue, { color: colors.text }]}>{product.quantity}</Text></Card><Field label="Change in quantity" value={change} onChangeText={setChange} placeholder="Use +10 to add or -2 to remove" keyboardType="numeric" helper="Enter a positive number for stock in and a negative number for stock out." /><Field label="Reason" value={reason} onChangeText={setReason} placeholder="e.g. New delivery or damaged item" multiline /><PrimaryButton label="Save adjustment" icon="check-circle" onPress={save} /></Screen>;
}

const styles = StyleSheet.create({ current: { alignItems: "center", paddingVertical: 21, marginBottom: 18 }, currentValue: { fontSize: 42, lineHeight: 49, fontWeight: "800", marginTop: 4 } });
