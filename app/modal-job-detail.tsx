import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Linking,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { JobListing, jobsStore } from "@/lib/jobs-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ModalJobDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [job, setJob] = useState<JobListing | undefined>(undefined);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // 1️⃣ Subscribe to store updates

    const unsub = jobsStore.subscribe(() => {
      setJob(jobsStore.get().find((j) => j.id === String(id)));
    }); // 2️⃣ Load all jobs from API if store is empty

    if (jobsStore.get().length === 0) {
      jobsStore.loadAll(); // this fetches from your backend and updates the store
    } // 3️⃣ Set initial job if already in store

    setJob(jobsStore.get().find((j) => j.id === String(id)));

    return () => {
      unsub();
    };
  }, [id]);

  if (!job)
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>Loading...</Text>
      </SafeAreaView>
    );

  const imageSource =
  job.images && job.images.length > 0
    ? job.images              // array of URLs
    : [require("../assets/images/brandlogo.png")];  // wrap fallback in array

  const title = job?.shop_name;
  const location = job?.location || "";
  const salary = job?.salary_text || "";
  const type = job?.job_type;
  const desc = job?.description || "No description provided.";
  const phone = job?.phone_number || "";

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
          accessibilityLabel="Back to Jobs"
          onPress={() => router.back()}
          style={styles.backRow}
        >
          <Feather name="arrow-left" size={18} color="#111827" />
          <Text style={styles.backText}>Back to Jobs</Text>
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
              {imageSource.map((img: any, index: any) => (
                <Image
                  key={index}
                  source={typeof img === "string" ? { uri: img } : img}
                  style={styles.hero}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Image Counter Badge */}
            {imageSource.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {imageSource.length}
                </Text>
              </View>
            )}

            {/* Pagination Dots */}
            {imageSource.length > 1 && (
              <View style={styles.pagination}>
                {imageSource.map((_:any, index: any) => (
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
            <View style={styles.rowMid}>
              <Text style={styles.priceSymbol}>£</Text>
              <Text style={styles.salaryText}> {salary.replace("£", "")}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{type}</Text>
            </View>
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
  priceSymbol: { color: "#10B981", fontWeight: "800" },
  salaryText: { color: "#10B981", fontWeight: "700" },
  badge: {
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },

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
