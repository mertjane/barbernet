import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  jobsStore,
  type JobListing as StoreJob,
  type JobType,
} from "../../lib/jobs-store";

export default function JobsScreen() {
  const router = useRouter();
  const { autoOpen } = useLocalSearchParams<{ autoOpen?: string }>();
  const [items, setItems] = useState<StoreJob[]>(jobsStore.get());
  const [location, setLocation] = useState<string>("All Locations");
  const [type, setType] = useState<string>("All Types");
  const [showLocation, setShowLocation] = useState(false);
  const [showType, setShowType] = useState(false);
  const [didOpen, setDidOpen] = useState(false);

  // ------------------------
  // Subscribe to store changes
  // ------------------------
  useEffect(() => {
    const unsub = jobsStore.subscribe(() => setItems(jobsStore.get()));

    // Load jobs from API on mount if store is empty
    if (jobsStore.get().length === 0) {
      jobsStore.loadAll();
    }

    return () => {
      unsub();
    };
  }, []);

  // ------------------------
  // Auto-open first job modal if needed
  // ------------------------
  useEffect(() => {
    if (!didOpen && autoOpen === "1" && items.length > 0) {
      setDidOpen(true);
      router.push({
        pathname: "/modal-job-detail",
        params: { id: items[0].id },
      });
    }
  }, [autoOpen, didOpen, items, router]);

  // ------------------------
  // Dynamic filter options from backend data
  // ------------------------
  const locationOptions = useMemo(() => {
    return ["All Locations", ...jobsStore.getUniqueLocations(items)];
  }, [items]);

  const typeOptions = useMemo(() => {
    return ["All Types", ...jobsStore.getUniqueTypes(items)];
  }, [items]);

  // ------------------------
  // Filters
  // ------------------------
  const filtered = useMemo(() => {
    return items.filter((j) => {
      const matchLocation = location === "All Locations" || j.location === location;
      const matchType = type === "All Types" || j.job_type === type;
      return matchLocation && matchType;
    });
  }, [items, location, type]);

  // ------------------------
  // Render
  // ------------------------
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <Text style={styles.headerTitle}>Job Listings</Text>

        {/* Post Job CTA */}
        <Pressable
          style={styles.postBtn}
          onPress={() => router.push("/modal-post-job")}
        >
          <Feather
            name="plus"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.postBtnText}>Post Job</Text>
        </Pressable>

        {/* Filters */}
        <View style={styles.filtersRow}>
          <Dropdown
            label={location}
            options={locationOptions}
            open={showLocation}
            onToggle={() => setShowLocation((v) => !v)}
            onSelect={(val) => {
              setLocation(val);
              setShowLocation(false);
            }}
          />
          <View style={{ width: 12 }} />
          <Dropdown
            label={type}
            options={typeOptions}
            open={showType}
            onToggle={() => setShowType((v) => !v)}
            onSelect={(val) => {
              setType(val);
              setShowType(false);
            }}
          />
        </View>

        {/* Job Cards */}
        <View style={{ marginTop: 8 }}>
          {filtered.length > 0 ? (
            filtered.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <Text style={styles.emptyText}>No jobs found</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Dropdown({
  label,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  options: readonly string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={onToggle} style={styles.dropdown}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
      </Pressable>
      {open && (
        <View style={styles.dropdownMenu}>
          {options.map((v) => (
            <Pressable
              key={v}
              onPress={() => onSelect(v)}
              style={styles.dropdownItem}
            >
              <Text style={styles.dropdownItemText}>{v}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function JobCard({ job }: { job: StoreJob }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({ pathname: "/modal-job-detail", params: { id: job.id } })
      }
    >
      <Image
        source={ 
          job.images?.[0]
            ? { uri: job.images[0] }
            : require("../../assets/images/brandlogo.png")
        }
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          {job.shop_name || "Job Listing"}
        </Text>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}
        >
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.cardMeta}> {job.location}</Text>
        </View>
        <View style={styles.badgesRow}>
          <View
            style={[
              styles.badge,
              { borderColor: "#10B981", backgroundColor: "#10B9811A" },
            ]}
          >
            <Text style={[styles.badgeText, { color: "#10B981" }]}>
              £ {job.salary_text?.replace("£", "") || "N/A"}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { borderColor: "#6B7280", backgroundColor: "#F3F4F6" },
            ]}
          >
            <Text style={[styles.badgeText, { color: "#374151" }]}>
              {job.job_type}
            </Text>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { padding: 16, marginTop: 24},

  headerTitle: {
    fontSize: 20,
    fontWeight: "400",
    color: "#111827",
    textAlign: "center",
    marginBottom: 14,
  },

  postBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",   
    flexDirection: "row",
    marginBottom: 12,
  },
  postBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  filtersRow: { flexDirection: "row", marginBottom: 12 },
  dropdown: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  dropdownLabel: { color: "#111827", fontSize: 14 },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12 },
  dropdownItemText: { color: "#111827", fontSize: 14 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  cardImage: { width: 48, height: 48, borderRadius: 12 },
  cardContent: { flex: 1, marginHorizontal: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardMeta: { fontSize: 12, color: "#6B7280" },
  badgesRow: { flexDirection: "row", marginTop: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },

  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 32,
    fontSize: 14,
  },
});