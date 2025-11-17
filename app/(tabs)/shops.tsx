import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  shopsStore,
  type ShopListing,
} from "../../lib/shops-store";

export default function ShopsScreen() {
  const router = useRouter();
  const { autoOpen } = useLocalSearchParams<{ autoOpen?: string }>();
  const [loading, setLoading] = useState(true);
  const [regionOpen, setRegionOpen] = useState(false);
  const [region, setRegion] = useState<string>("All Regions");
  const [shops, setShops] = useState<ShopListing[]>(shopsStore.get());
  const [didOpen, setDidOpen] = useState(false);

  // Subscribe to store updates
  useEffect(() => {
    const unsub = shopsStore.subscribe(() => setShops(shopsStore.get()));
    return () => {
      unsub()
    };
  }, []);

  // Fetch all shops from backend
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await shopsStore.fetchAll();
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto open first shop if needed
  useEffect(() => {
    if (!didOpen && autoOpen === "1" && shops.length > 0) {
      setDidOpen(true);
      router.push(`/modal-shop-detail?id=${shops[0].id}` as any);
    }
  }, [autoOpen, didOpen, shops, router]);

  // Dynamic region options from backend data
  const regionOptions = useMemo(() => {
    return ["All Regions", ...shopsStore.getUniqueLocations(shops)];
  }, [shops]);

  const filtered = useMemo(() => {
    if (region === "All Regions") return shops;
    return shops.filter((s) => s.location === region);
  }, [region, shops]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Shops for Sale</Text>

        <Pressable
          style={styles.listBtn}
          onPress={() => router.push("/modal-list-shop")}
        >
          <Feather
            name="plus"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.listBtnText}>List Your Shop</Text>
        </Pressable>

        {/* Region Filter */}
        <View style={{ marginBottom: 12 }}>
          <Pressable
            style={styles.filter}
            onPress={() => setRegionOpen((v) => !v)}
          >
            <Text style={styles.filterLabel}>{region}</Text>
            <Feather
              name={regionOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#6B7280"
            />
          </Pressable>
          {regionOpen && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 300 }}>
                {regionOptions.map((r) => (
                  <Pressable
                    key={r}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setRegion(r);
                      setRegionOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{r}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Loading / Shop Cards */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#10B981"
            style={{ marginTop: 40 }}
          />
        ) : filtered.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#6B7280", marginTop: 20 }}>
            No shops found.
          </Text>
        ) : (
          filtered.map((item) => (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() =>
                router.push(`/modal-shop-detail?id=${item.id}` as any)
              }
            >
              <Image
                source={
                  item.images && item.images.length > 0
                    ? { uri: item.images[0] }
                    : require("../../assets/images/brandLogo.png")
                }
                style={styles.cardImg}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.shop_name}</Text>
                <View style={styles.rowMid}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.locText}> {item.location}</Text>
                </View>
                <Text style={styles.price}>{item.sale_price}</Text>
                <Text numberOfLines={2} style={styles.desc}>
                  {item.info}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { padding: 16, marginTop: 24 },
  header: {
    fontSize: 20,
    fontWeight: "400",
    color: "#111827",
    textAlign: "center",
    marginBottom: 14,
  },
  listBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  listBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  filter: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterLabel: { color: "#111827", fontSize: 14 },
  dropdown: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownItemText: { color: "#111827" },
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  },
  cardImg: { width: 64, height: 64, borderRadius: 12, marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  rowMid: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  locText: { color: "#6B7280", fontSize: 12 },
  price: { 
    color: "#10B981", 
    fontWeight: "800", 
    fontSize: 14, 
    marginTop: 4 
  },
  desc: { marginTop: 6, color: "#6B7280", fontSize: 12 },
});