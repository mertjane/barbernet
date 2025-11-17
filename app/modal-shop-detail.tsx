import React, { useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { shopsStore, type ShopListing } from "../lib/shops-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ModalShopDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const shop = useMemo<ShopListing | undefined>(
    () => shopsStore.get().find((s) => s.id === String(id)),
    [id]
  );

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const images = shop?.images && shop.images.length > 0 
    ? shop.images 
    : [require("../assets/images/brandLogo.png")];
  const title = shop?.shop_name || "Shop Listing";
  const location = shop?.location;
  const price = shop?.sale_price ?? 0;
  const desc = shop?.info || "No description provided.";
  const phone = shop?.phone_number || "";


  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / (SCREEN_WIDTH - 32));
    setCurrentImageIndex(currentIndex);
  };

  const contact = async () => {
    if (!phone) {
      Alert.alert(
        "No phone number",
        "This listing did not include a phone number."
      );
      return;
    }
    const url = `tel:${phone.replace(/\s+/g, "")}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url);
    else Alert.alert("Cannot dial", "Device cannot open the phone dialer.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Shops"
          onPress={() => router.back()}
          style={styles.backRow}
        >
          <Feather name="arrow-left" size={18} color="#111827" />
          <Text style={styles.backText}>Back to Shops</Text>
        </Pressable>

        <View style={styles.card}>
          <View style={styles.imageSliderContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.imageSlider}
            >
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={typeof img === 'string' ? { uri: img } : img}
                  style={styles.hero}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Image Counter Badge */}
            {images.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {images.length}
                </Text>
              </View>
            )}

            {/* Pagination Dots */}
            {images.length > 1 && (
              <View style={styles.pagination}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      currentImageIndex === index && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <Text style={styles.shopName}>{title}</Text>

          <View style={styles.rowMid}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.locText}> {location}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.price}>{price}</Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>{desc}</Text>

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
            Contact Information
          </Text>
          <View style={styles.rowMid}>
            <Feather name="phone" size={16} color="#111827" />
            <Text style={styles.phoneText}> {phone || "—"}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Contact"
            onPress={contact}
            style={[styles.contactBtn, !phone && styles.contactBtnDisabled]}
            disabled={!phone}
          >
            <Feather
              name="phone"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.contactText}>Contact</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 16 },

  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { marginLeft: 6, color: "#111827" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  imageSliderContainer: {
    position: "relative",
    marginBottom: 12,
  },
  imageSlider: {
    borderRadius: 12,
    overflow: "hidden",
  },
  hero: { 
    width: SCREEN_WIDTH - 32 - 24, // Screen width minus padding
    height: 200, 
    borderRadius: 12,
  },

  imageCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  pagination: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },

  shopName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  rowMid: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  locText: { color: "#6B7280" },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  price: { color: "#10B981", fontWeight: "800", fontSize: 16 },
  chairsText: { color: "#6B7280", fontSize: 12 },

  sectionTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  desc: { marginTop: 6, color: "#4B5563", lineHeight: 22 },

  phoneText: { color: "#111827" },
  contactBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#0F9D8A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  contactBtnDisabled: { backgroundColor: "#0F9D8A99" },
  contactText: { color: "#FFFFFF", fontWeight: "700" },
});
