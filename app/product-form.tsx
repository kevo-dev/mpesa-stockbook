import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Field, KeyValue, PrimaryButton, Screen, TopBar } from "@/components/stockbook/ui";
import { formatKes, productMargin, productProfit, potentialSalesValue, stockValue } from "@/lib/stockbook/calculations";
import { useStockbook } from "@/lib/stockbook/store";
import { useColors } from "@/hooks/use-colors";

export default function ProductFormScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { state, addProduct, updateProduct, duplicateProduct, deleteProduct } = useStockbook();
  const colors = useColors();
  const product = state.products.find((item) => item.id === productId);
  const [name, setName] = useState(product?.name ?? ""); const [sku, setSku] = useState(product?.sku ?? ""); const [category, setCategory] = useState(product?.category ?? "General"); const [buying, setBuying] = useState(String(product?.buyingPrice ?? "")); const [selling, setSelling] = useState(String(product?.sellingPrice ?? "")); const [quantity, setQuantity] = useState(String(product?.quantity ?? "")); const [threshold, setThreshold] = useState(String(product?.lowStockThreshold ?? "5")); const [supplier, setSupplier] = useState(product?.supplierName ?? "");
  const parsed = { buyingPrice: Number(buying), sellingPrice: Number(selling), quantity: Number(quantity), lowStockThreshold: Number(threshold) };
  const preview = { ...parsed, id: "preview", name, category, sku, supplierName: supplier, createdAt: "", updatedAt: "", isArchived: false };
  const save = () => {
    try {
      const input = { name, sku: sku.trim() || undefined, category: category.trim() || "General", buyingPrice: parsed.buyingPrice, sellingPrice: parsed.sellingPrice, quantity: parsed.quantity, lowStockThreshold: parsed.lowStockThreshold, supplierName: supplier.trim() || undefined, imageUri: undefined };
      if (product) updateProduct(product.id, input); else addProduct(input);
      router.back();
    } catch (error) { Alert.alert("Could not save product", error instanceof Error ? error.message : "Please check the details and try again."); }
  };
  const archive = () => { if (!product) return; Alert.alert("Archive product?", "It will be unavailable for new sales, but past sales stay unchanged.", [{ text: "Cancel", style: "cancel" }, { text: "Archive", style: "destructive", onPress: () => { deleteProduct(product.id); router.back(); } }]); };
  return <Screen><TopBar title={product ? "Edit product" : "Add product"} onBack={() => router.back()} /><Field label="Product name" value={name} onChangeText={setName} placeholder="e.g. Milk 500ml" /><Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Groceries" /><Field label="SKU (optional)" value={sku} onChangeText={setSku} placeholder="Internal product code" /><View style={styles.two}><View style={styles.half}><Field label="Buying price" value={buying} onChangeText={setBuying} placeholder="0" keyboardType="numeric" /></View><View style={styles.half}><Field label="Selling price" value={selling} onChangeText={setSelling} placeholder="0" keyboardType="numeric" /></View></View><View style={styles.two}><View style={styles.half}><Field label="Current quantity" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" /></View><View style={styles.half}><Field label="Low-stock level" value={threshold} onChangeText={setThreshold} placeholder="5" keyboardType="numeric" /></View></View><Field label="Supplier (optional)" value={supplier} onChangeText={setSupplier} placeholder="Supplier name" /><Card style={styles.calculations}><Text style={[styles.calculationTitle, { color: colors.text }]}>Product calculations</Text><KeyValue label="Profit per unit" value={formatKes(productProfit(preview))} positive={productProfit(preview) >= 0} /><KeyValue label="Profit margin" value={`${productMargin(preview).toFixed(1)}%`} positive={productMargin(preview) >= 0} /><KeyValue label="Stock value" value={formatKes(stockValue(preview))} /><KeyValue label="Potential sales value" value={formatKes(potentialSalesValue(preview))} /></Card><PrimaryButton label={product ? "Save changes" : "Add product"} icon="check-circle" onPress={save} />{product ? <View style={styles.existingActions}><Pressable onPress={() => { duplicateProduct(product.id); Alert.alert("Product duplicated", "A copy is ready in your Products list."); }} accessibilityRole="button"><Text style={{ color: colors.primary, fontWeight: "800" }}>Duplicate product</Text></Pressable><Pressable onPress={archive} accessibilityRole="button"><Text style={{ color: colors.error, fontWeight: "800" }}>Archive product</Text></Pressable></View> : null}</Screen>;
}

const styles = StyleSheet.create({ two: { flexDirection: "row", gap: 10 }, half: { flex: 1 }, calculations: { marginTop: 4 }, calculationTitle: { fontSize: 15, fontWeight: "800", marginBottom: 3 }, existingActions: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 7, marginTop: 20, minHeight: 44, alignItems: "center" } });
