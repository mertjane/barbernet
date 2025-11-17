import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { barbersStore, type BarberProfile } from "../lib/barbers-store";

export default function ModalBarberDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [barber, setBarber] = useState<BarberProfile | undefined>(
    barbersStore.get().find((b) => b.id === String(id))
  );
  const [loading, setLoading] = useState(false);

  // Fetch barber details if not in store
  useEffect(() => {
    const loadBarber = async () => {
      if (!id) return;

      // Check if barber exists in store
      const existing = barbersStore.get().find((b) => b.id === String(id));
      if (existing) {
        setBarber(existing);
        return;
      }

      // Fetch from API if not in store
      try {
        setLoading(true);
        const fetchedBarber = await barbersStore.fetchById(String(id));
        setBarber(fetchedBarber);
      } catch (error) {
        console.error("Error loading barber:", error);
        Alert.alert("Error", "Failed to load barber profile");
      } finally {
        setLoading(false);
      }
    };

    loadBarber();
  }, [id]);

  // Subscribe to store updates
  useEffect(() => {
    const unsub = barbersStore.subscribe(() => {
      const updated = barbersStore.get().find((b) => b.id === String(id));
      if (updated) setBarber(updated);
    });

    return () => {
      unsub();
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          size="large"
          color="#10B981"
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  if (!barber) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.scroll}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backRow}
          >
            <Feather name="arrow-left" size={18} color="#111827" />
            <Text style={styles.backText}>Back to Barbers</Text>
          </Pressable>
          <Text
            style={{ textAlign: "center", color: "#6B7280", marginTop: 20 }}
          >
            Barber not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Map data from backend structure
  const avatar =
    barber.images && barber.images.length > 0
      ? { uri: barber.images[0] }
      : require("../assets/images/brand-logo.png");
  const name = barber.full_name || "Barber Profile";
  const location = barber.city || "Location not specified";
  const experienceText = barber.experience || "Experience not specified";
  const skills = barber.skills || [];
  const specialities = barber.specialities || [];
  const bio = barber.bio || "No bio provided.";
  const phone = barber.phone_number || "";
  const email = barber.email || "";

  const dial = async () => {
    if (!phone) {
      Alert.alert("No phone number", "This profile has no phone number.");
      return;
    }
    const url = `tel:${phone.replace(/\s+/g, "")}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      Linking.openURL(url);
    } else {
      Alert.alert("Cannot dial", "Device cannot open the phone dialer.");
    }
  };

  const mail = async () => {
    if (!email) {
      Alert.alert("No email", "This profile has no email.");
      return;
    }
    const url = `mailto:${email}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      Linking.openURL(url);
    } else {
      Alert.alert("Cannot email", "Device cannot open the mail app.");
    }
  };

  // Combine skills and specialities for display
  const allSkills = [...skills, ...specialities];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Barbers"
          onPress={() => router.back()}
          style={styles.backRow}
        >
          <Feather name="arrow-left" size={18} color="#111827" />
          <Text style={styles.backText}>Back to Barbers</Text>
        </Pressable>

        <View style={styles.card}>
          {/* Header with Avatar and Info */}
          <View style={styles.headerRow}>
            <Image source={avatar} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>{name}</Text>
              <View style={styles.rowMid}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.locText}> {location}</Text>
              </View>
              <Text style={styles.metaText}>{experienceText}</Text>
            </View>
          </View>

          {/* Skills Section */}
          <Text style={styles.sectionTitle}>Skills & Specialties</Text>
          <View style={styles.skillsGrid}>
            {allSkills.length > 0 ? (
              allSkills.map((s, index) => (
                <View key={`${s}-${index}`} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>No skills listed.</Text>
            )}
          </View>

          {/* About Section */}
          {bio && bio !== "No bio provided." && (
            <>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bio}>{bio}</Text>
            </>
          )}

          {/* Contact Section */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Contact</Text>
          <View style={styles.contactCol}>
            <View style={styles.rowMid}>
              <Feather name="phone" size={16} color="#111827" />
              <Text style={styles.contactText}> {phone || "—"}</Text>
            </View>
            {email && (
              <View style={[styles.rowMid, { marginTop: 6 }]}>
                <Feather name="mail" size={16} color="#111827" />
                <Text style={styles.contactText}> {email}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call barber"
              onPress={dial}
              disabled={!phone}
              style={[styles.ctaBtn, !phone && styles.ctaDisabled]}
            >
              <Feather
                name="phone"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.ctaText}>Call</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Email barber"
              onPress={mail}
              disabled={!email}
              style={[styles.ctaBtn, !email && styles.ctaDisabled]}
            >
              <Feather
                name="mail"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.ctaText}>Email</Text>
            </Pressable>
          </View>
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
  headerRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  rowMid: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locText: { color: "#6B7280" },
  metaText: { color: "#6B7280", marginTop: 4 },

  sectionTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  skillsGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  skillText: { fontSize: 12, color: "#111827", fontWeight: "600" },
  muted: { color: "#6B7280" },

  bio: { marginTop: 6, color: "#4B5563", lineHeight: 22 },
  contactCol: { marginTop: 6 },
  contactText: { color: "#111827" },

  ctaBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  ctaDisabled: { backgroundColor: "#10B98199" },
  ctaText: { color: "#FFFFFF", fontWeight: "700" },
});
