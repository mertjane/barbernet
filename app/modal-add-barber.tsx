import React, { useMemo, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { barbersStore, type City, CITIES } from "../lib/barbers-store";
import { getFirebaseAuth } from "@/config/firebase-config";

const SKILLS = [
  "Classic Cuts",
  "Beard Styling",
  "Fade Cuts",
  "Creative Cuts",
  "Color Work",
  "Undercuts",
  "Straight Razor",
  "Mustache Grooming",
  "Hot Towel Shave",
  "Clipper Work",
  "Head Shaving",
  "Texture Cutting",
] as const;
const SPECIALTIES = [
  "Traditional Barbering",
  "Modern Styles",
  "Wedding/Events",
  "Corporate Cuts",
  "Afro-Caribbean Hair",
  "Curly Hair",
  "Men's Grooming",
  "Vintage Styles",
  "Creative Cuts",
  "Children's Cuts",
  "Senior Clients",
  "Hair Treatments",
] as const;
const EXPERIENCE_LEVELS = [
  "0-1 years",
  "2-3 years",
  "4-6 years",
  "7-10 years",
  "10+ years",
] as const;

export interface BarberForm {
  full_name: string;
  city: City | "";
  bio: string;
  phone_number: string;
  email: string;
  experience: string;
  skills: string[];
  specialities: string[];
  images: string[];
}

export default function ModalAddBarber() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const auth = getFirebaseAuth();

  const [openCity, setOpenCity] = useState(false);
  const [openExperience, setOpenExperience] = useState(false);
  const [form, setForm] = useState<BarberForm>({
    full_name: "",
    city: "",
    bio: "",
    phone_number: "",
    email: "",
    experience: "",
    skills: [],
    specialities: [],
    images: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customSkill, setCustomSkill] = useState("");
  const [customSpec, setCustomSpec] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch from server and set form
    const loadBarber = async () => {
      try {
        const barber = await barbersStore.fetchById(id);
        setForm({
          full_name: barber.full_name,
          city: barber.city,
          bio: barber.bio || "",
          phone_number: barber.phone_number,
          email: barber.email || "",
          experience: barber.experience,
          skills: barber.skills || [],
          specialities: barber.specialities || [],
          images: barber.images || [],
        });
      } catch (error) {
        console.error("Error loading barber:", error);
        Alert.alert("Error", "Failed to load barber profile");
      }
    };

    loadBarber();
  }, [id]);

  // Validation
  const valid = useMemo(() => {
    const e: Record<string, string> = {};

    if (!form.full_name || form.full_name.trim().length < 2) {
      e.full_name = "Name is required (min 2 characters)";
    }

    if (!form.city) {
      e.city = "City is required";
    }

    if (!form.phone_number || !/^\+?\d{7,15}$/.test(form.phone_number)) {
      e.phone_number = "Valid phone required (7-15 digits)";
    }

    if (form.email && !/.+@.+\..+/.test(form.email)) {
      e.email = "Valid email required";
    }

    if (!form.experience) {
      e.experience = "Experience level is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  // Toggle skills
  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  // Toggle specialities
  const toggleSpec = (spec: string) => {
    setForm((prev) => ({
      ...prev,
      specialities: prev.specialities.includes(spec)
        ? prev.specialities.filter((s) => s !== spec)
        : [...prev.specialities, spec],
    }));
  };

  // Add custom skill
  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;

    if (!form.skills.includes(trimmed)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setCustomSkill("");
  };

  // Add custom specialty
  const addCustomSpec = () => {
    const trimmed = customSpec.trim();
    if (!trimmed) return;

    if (!form.specialities.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        specialities: [...prev.specialities, trimmed],
      }));
    }
    setCustomSpec("");
  };

  // Pick and convert photo to base64
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true, // Request base64
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      try {
        const asset = res.assets[0];

        // Use base64 directly from asset
        const base64Uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri; // Fallback to URI

        // Add to images array (replace first image if exists, or add new)
        setForm((prev) => ({
          ...prev,
          images: [base64Uri, ...prev.images.slice(1)],
        }));
      } catch (error) {
        console.error("Error processing image:", error);
        Alert.alert("Error", "Failed to process image");
      }
    }
  };

  // Submit form
  const submit = async () => {
    if (!valid) {
      Alert.alert(
        "Validation Error",
        "Please fix all errors before submitting"
      );
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setIsLoading(true);

    try {
      if (id) {
        // Update existing barber
        await barbersStore.update(id, {
          ...form,
          city: form.city as City,
          owner_id: auth.currentUser.uid,
        });
        Alert.alert("Success", "Barber profile updated successfully");
      } else {
        // Create new barber
        await barbersStore.add({
          ...form,
          city: form.city as City,
          owner_id: auth.currentUser.uid,
        });
        Alert.alert("Success", "Barber profile created successfully");
      }

      router.back();
    } catch (error: any) {
      console.error("Error submitting barber:", error);
      Alert.alert("Error", error.message || "Failed to save barber profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={18} color="#111827" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {id ? "Edit Barber Profile" : "Create Barber Profile"}
            </Text>
            <Text style={styles.headerSub}>
              Share your skills and connect with employers
            </Text>
          </View>
        </View>

        {/* Photo */}
        <Pressable
          style={styles.photo}
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel="Add Photo"
        >
          {form.images.length > 0 ? (
            <Image source={{ uri: form.images[0] }} style={styles.photoImg} />
          ) : (
            <View style={styles.photoInner}>
              <Feather name="camera" size={18} color="#6B7280" />
              <Text style={styles.photoText}>Add Photo</Text>
            </View>
          )}
        </Pressable>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#9CA3AF"
          value={form.full_name}
          onChangeText={(v) => setForm((p) => ({ ...p, full_name: v }))}
          style={[styles.input, !!errors.full_name && styles.inputError]}
        />
        {errors.full_name ? (
          <Text style={styles.err}>{errors.full_name}</Text>
        ) : null}

        <Pressable
          style={[styles.dropdown]}
          onPress={() => setOpenCity((v) => !v)}
        >
          <Text style={styles.dropdownLabel}>{form.city || "Select City"}</Text>
          <Feather
            name={openCity ? "chevron-up" : "chevron-down"}
            size={18}
            color="#6B7280"
          />
        </Pressable>
        {openCity && (
          <View style={styles.dropdownMenu}>
            {CITIES.map((c) => (
              <Pressable
                key={c}
                style={styles.dropdownItem}
                onPress={() => {
                  setForm((p) => ({ ...p, city: c }));
                  setOpenCity(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{c}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {errors.city ? <Text style={styles.err}>{errors.city}</Text> : null}

        {/* Bio and Contact before experience/skills per request */}

        <TextInput
          placeholder="Short bio"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={form.bio}
          onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
          style={[styles.textarea, !!errors.bio && styles.inputError]}
        />
        {errors.bio ? <Text style={styles.err}>{errors.bio}</Text> : null}

        <TextInput
          placeholder="Phone (+44...)"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          value={form.phone_number}
          onChangeText={(v) => setForm((p) => ({ ...p, phone_number: v }))}
          style={[styles.input, !!errors.phone_number && styles.inputError]}
        />
        {errors.phone_number ? (
          <Text style={styles.err}>{errors.phone_number}</Text>
        ) : null}

        <TextInput
          placeholder="Email (optional)"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
          style={[styles.input, !!errors.email && styles.inputError]}
        />
        {errors.email ? <Text style={styles.err}>{errors.email}</Text> : null}

        {/* Experience moved below contact and above skills; optional */}
        <View>
          <Pressable
            style={[styles.dropdown, !!errors.experience && styles.inputError]}
            onPress={() => setOpenExperience((v) => !v)}
          >
            <Text style={styles.dropdownLabel}>
              {form.experience || "Select experience level (optional)"}{" "}
            </Text>
            <Feather
              name={openExperience ? "chevron-up" : "chevron-down"}
              size={18}
              color="#6B7280"
            />
          </Pressable>
          {openExperience && (
            <View style={styles.dropdownMenu}>
              {EXPERIENCE_LEVELS.map((l) => (
                <Pressable
                  key={l}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setForm((p) => ({ ...p, experience: l }));
                    setOpenExperience(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{l}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Skills</Text>
        <Text style={styles.sectionHelp}>
          Select or add your barbering skills
        </Text>
        <View style={styles.pillsGrid}>
          {SKILLS.map((s) => (
            <Pressable
              key={s}
              onPress={() => toggleSkill(s)}
              accessibilityRole="button"
              accessibilityLabel={`Skill ${s}`}
              style={[
                styles.pill,
                form.skills.includes(s) ? styles.pillOn : null,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  form.skills.includes(s) ? styles.pillTextOn : null,
                ]}
              >
                {form.skills.includes(s) ? "− " : "+ "}
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput
            placeholder="Add custom skill..."
            placeholderTextColor="#9CA3AF"
            value={customSkill}
            onChangeText={setCustomSkill}
            style={styles.input}
          />
          <Pressable style={styles.addBtn} onPress={addCustomSkill}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
          Specialties
        </Text>
        <Text style={styles.sectionHelp}>What areas do you specialize in?</Text>
        <View style={styles.pillsGrid}>
          {SPECIALTIES.map((spec) => (
            <Pressable
              key={spec}
              onPress={() => toggleSpec(spec)}
              accessibilityRole="button"
              accessibilityLabel={`Specialty ${spec}`}
              style={[
                styles.pill,
                form.specialities.includes(spec) && styles.pillOn,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  form.specialities.includes(spec) && styles.pillTextOn,
                ]}
              >
                {form.specialities.includes(spec) ? "− " : "+ "}
                {spec}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput
            placeholder="Add custom specialty..."
            placeholderTextColor="#9CA3AF"
            value={customSpec}
            onChangeText={setCustomSpec}
            style={styles.input}
          />
          <Pressable style={styles.addBtn} onPress={addCustomSpec}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={submit}
          disabled={!valid || isLoading}
          style={styles.footerBtn}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.footerBtnText}>
              {id ? "Update Profile" : "Create Profile"}
            </Text>
          )}
        </Pressable>
        <Text style={styles.footerHelp}>
          Your profile will be visible to potential employers immediately
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { padding: 16, marginTop: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  headerSub: { color: "#6B7280", marginTop: 2 },

  photo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F3F4F6",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  photoInner: { alignItems: "center" },
  photoText: { marginTop: 4, color: "#6B7280", fontSize: 12 },
  photoImg: { width: 88, height: 88, borderRadius: 44 },

  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    color: "#111827",
    marginBottom: 12,
  },
  textarea: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    color: "#111827",
    marginBottom: 12,
  },
  inputError: { borderColor: "#FCA5A5" },
  err: { color: "#B91C1C", fontSize: 12, marginBottom: 6 },

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
    marginBottom: 12,
  },
  dropdownLabel: { color: "#111827", fontSize: 14 },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginBottom: 8,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12 },
  dropdownItemText: { color: "#111827", fontSize: 14 },

  rowGap: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

  toggle: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  toggleOn: { backgroundColor: "#10B9811A", borderColor: "#10B981" },
  toggleText: { color: "#111827", fontWeight: "600" },
  toggleTextOn: { color: "#10B981" },

  sectionTitle: { fontWeight: "700", color: "#111827" },
  sectionHelp: { color: "#6B7280", fontSize: 12, marginBottom: 8 },
  pillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  pillOn: { backgroundColor: "#10B981", borderColor: "#10B981" },
  pillText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  pillTextOn: { color: "#FFFFFF" },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  addBtn: {
    marginLeft: 8,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  addBtnText: { color: "#111827", fontWeight: "700" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    paddingBottom: 46,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnDisabled: {
    opacity: 0.6, // Dim button when loading
  },
  footerBtnText: { color: "#FFFFFF", fontWeight: "700" },
  footerHelp: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
    marginTop: 6,
  },
});
