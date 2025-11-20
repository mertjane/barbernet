import React, { useEffect, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { JobListing, jobsStore } from "../../lib/jobs-store";
import { BarberProfile, barbersStore } from "../../lib/barbers-store";
import { ShopListing, shopsStore } from "../../lib/shops-store";
import { useRouter } from "expo-router";
import { userStore } from "../../lib/user-store";

export default function HomeScreen() {
  const router = useRouter();
  const [name, setName] = useState(userStore.get().name);
  const [loading, setLoading] = useState(true);

  // State for reactive store data
  const [jobs, setJobs] = useState<JobListing[]>(jobsStore.get());
  const [barbers, setBarbers] = useState<BarberProfile[]>(barbersStore.get());
  const [shops, setShops] = useState<ShopListing[]>(shopsStore.get());

  useEffect(() => {
    const unsub = userStore.subscribe(() => setName(userStore.get().name));
    return () => {
      unsub();
    }; // wrap in {} so nothing is returned
  }, []);

  // Subscribe to all stores and fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          jobsStore.loadAll(),
          barbersStore.fetchAll(),
          shopsStore.fetchAll(),
        ]);
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to store changes
    const unsubJobs = jobsStore.subscribe(() => setJobs(jobsStore.get()));
    const unsubBarbers = barbersStore.subscribe(() =>
      setBarbers(barbersStore.get())
    );
    const unsubShops = shopsStore.subscribe(() => setShops(shopsStore.get()));

    return () => {
      unsubJobs();
      unsubBarbers();
      unsubShops();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingLabel}>Hi, {name}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Tagline */}
        <Text style={styles.tagline}>
          Join thousands of barbers building their future together.
        </Text>

        {/* Feature Cards Grid */}
        <View style={styles.grid}>
          <FeatureCard
            title="Find a Job"
            subtitle="Browse job listings for barbers"
            colors={["#2563EB", "#3B82F6"] as const}
            icon={
              <Ionicons name="briefcase-outline" size={20} color="#2563EB" />
            }
            onPress={() => router.push("/(tabs)/jobs")}
          />
          <FeatureCard
            title="Barbers"
            subtitle="Profiles of barbers looking for work"
            colors={["#059669", "#10B981"] as const}
            icon={<Ionicons name="people-outline" size={20} color="#059669" />}
            onPress={() => router.push("/(tabs)/barbers")}
          />
          <FeatureCard
            title="Shops for Sale"
            subtitle="Barber shop listings"
            colors={["#7C3AED", "#8B5CF6"] as const}
            icon={<Feather name="shopping-bag" size={20} color="#7C3AED" />}
            onPress={() => router.push("/(tabs)/shops")}
          />
          <FeatureCard
            title="Equipment"
            subtitle="Coming Soon"
            disabled
            grey
            icon={<Feather name="box" size={20} color="#6B7280" />}
          />
        </View>

        {/* Featured Listings */}
        <Text style={styles.sectionTitle}>Featured Listings</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#10B981"
            style={{ marginVertical: 20 }}
          />
        ) : (
          <View style={styles.listCol}>
            {/* Job Listing */}
            {jobs.length > 0 && (
              <ListingCard
                imageUri={jobs[0].images?.[0]}
                title={jobs[0].shop_name || "Job Listing"}
                subtitle={jobs[0].location || "Location"}
                badgeText={jobs[0].job_type || "Job"}
                badgeColor="#10B981"
                onPress={() =>
                  router.push({
                    pathname: "/modal-job-detail",
                    params: { id: jobs[0].id },
                  })
                }
              />
            )}

            {/* Barber Profile */}
            {barbers.length > 0 && (
              <ListingCard
                title={barbers[0].full_name}
                subtitle={barbers[0].experience || "Experience"}
                imageUri={barbers[0].images?.[0]}
                badgeText="Available"
                badgeColor="#10B981"
                onPress={() =>
                  router.push(`/modal-barber-detail?id=${barbers[0].id}` as any)
                }
              />
            )}

            {/* Shop Listing */}
            {shops.length > 0 && (
              <ListingCard
                title={shops[0].shop_name || "Shop Listing"}
                subtitle={`${shops[0].location || "Location"} • ${
                  shops[0].sale_price || "Price"
                }`}
                imageUri={shops[0].images?.[0]}
                badgeText="For Sale"
                badgeColor="#8B5CF6"
                onPress={() =>
                  router.push(`/modal-shop-detail?id=${shops[0].id}` as any)
                }
              />
            )}

            {/* Empty state */}
            {jobs.length === 0 &&
              barbers.length === 0 &&
              shops.length === 0 && (
                <Text style={styles.emptyText}>
                  No featured listings available yet.
                </Text>
              )}
          </View>
        )}

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <StatBox
            value={jobs.length.toLocaleString()}
            label="Active Jobs"
            color="#10B981"
          />
          <StatBox
            value={barbers.length.toLocaleString()}
            label="Barbers"
            color="#10B981"
          />
          <StatBox
            value={shops.length.toLocaleString()}
            label="Shops for Sale"
            color="#8B5CF6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({
  title,
  subtitle,
  icon,
  colors,
  onPress,
  disabled,
  grey,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  colors?: readonly [string, string];
  onPress?: () => void;
  disabled?: boolean;
  grey?: boolean;
}) {
  if (grey) {
    return (
      <View style={[styles.card, styles.cardGrey]}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>{icon}</View>
        </View>
        <Text style={[styles.cardTitle, { color: "#111827" }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: "#6B7280" }]}>
          {subtitle}
        </Text>
        <Feather
          name="arrow-right"
          size={18}
          color="#9CA3AF"
          style={styles.cardArrow}
        />
      </View>
    );
  }
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={styles.card}
    >
      <LinearGradient
        colors={(colors || ["#111827", "#111827"]) as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBg}
      >
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>{icon}</View>
        </View>
        <View>
          <Text style={[styles.cardTitle, { color: "#FFFFFF" }]}>{title}</Text>
          <Text style={[styles.cardSubtitle, { color: "#E5E7EB" }]}>
            {subtitle}
          </Text>
        </View>
        <Feather
          name="arrow-right"
          size={18}
          color="#FFFFFF"
          style={styles.cardArrow}
        />
      </LinearGradient>
    </Pressable>
  );
}

function ListingCard({
  title,
  subtitle,
  badgeText,
  imageUri,
  badgeColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  imageUri?: string;
  badgeText: string;
  badgeColor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.listCard} onPress={onPress}>
      <Image
        source={
          imageUri
            ? { uri: imageUri }
            : require("../../assets/images/brand-logo.png")
        }
        style={styles.listImage}
      />
      <View style={styles.listContent}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Feather name="scissors" size={14} color="#10B981" />
          <Text style={styles.listTitle}> {title}</Text>
        </View>
        <Text style={styles.listSubtitle}>{subtitle}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: `${badgeColor}1A`, borderColor: badgeColor },
          ]}
        >
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {badgeText}
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

function StatBox({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { paddingVertical: 16, paddingHorizontal: 16, marginTop: 24 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  greetingLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  bellWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 2,
    backgroundColor: "#F3F4F6",
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  tagline: {
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
  },
  cardBg: {
    borderRadius: 16,
    padding: 14,
    minHeight: 118,
  },
  cardGrey: {
    backgroundColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    minHeight: 118,
  },
  iconOuter: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubtitle: { marginTop: 6, fontSize: 12, color: "#6B7280" },
  cardArrow: { position: "absolute", right: 12, bottom: 12 },
  badgeSoon: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  badgeSoonText: { fontSize: 11, color: "#6B7280", fontWeight: "600" },

  sectionTitle: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  listCol: {},
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  listImage: { width: 44, height: 44, borderRadius: 10 },
  listContent: { flex: 1, marginHorizontal: 12 },
  listTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  listSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
  },
  statBox: {
    width: "32%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
  },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { marginTop: 4, fontSize: 11, color: "#6B7280" },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    marginVertical: 20,
  },
});
