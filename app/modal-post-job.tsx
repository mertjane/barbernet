import React, { useMemo, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { jobsStore, type JobType, type JobListing } from "../lib/jobs-store";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { userStore } from "../lib/user-store";
import { styles } from "@/styles/_modal-post-job.styles";
import { getStoredUserId } from "@/lib/session";

// Map display types to API types
const JOB_TYPE_DISPLAY: Record<string, JobType> = {
  "full time": "Full-time",
  "part time": "Part-time",
  "rent a chair": "Rent a Chair",
  temporary: "Temporary",
  contract: "Contract",
};

const JOB_TYPES = Object.keys(JOB_TYPE_DISPLAY);

interface FormState {
  shopName: string;
  location: string;
  type?: string; // Display type (lowercase)
  salaryText: string;
  description: string;
  phone: string;
  images: string[];
}

export default function ModalPostJob() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [form, setForm] = useState<FormState>({
    shopName: "",
    location: "",
    type: undefined,
    salaryText: "",
    description: "",
    phone: "",
    images: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openType, setOpenType] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Load existing job data if editing
  useEffect(() => {
    if (!id) return;
    const existing = jobsStore.get().find((j) => j.id === String(id));
    if (existing) {
      // Convert API type to display type
      const displayType = Object.entries(JOB_TYPE_DISPLAY).find(
        ([_, apiType]) => apiType === existing.job_type
      )?.[0];

      setForm({
        shopName: existing.shop_name || "",
        location: existing.location || "",
        type: displayType,
        salaryText: existing.salary_text || "",
        description: existing.description || "",
        phone: existing.phone_number || "",
        images: existing.images || [],
      });
    }
  }, [id]);

  const isValid = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.shopName.trim() || form.shopName.trim().length < 3)
      e.shopName = "Shop name is required (min 3 chars).";
    if (!form.location.trim()) e.location = "Location is required.";
    if (!form.type) e.type = "Job type is required.";
    if (!form.salaryText.trim()) e.salaryText = "Salary/Pay is required.";
    if (!form.description.trim() || form.description.trim().length < 10)
      e.description = "Description is required (min 10 chars).";
    if (!/^\+?\d[\d\s]{7,}$/.test(form.phone))
      e.phone = "Enter a valid phone number.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Please allow photo library access.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // ✅ Enable multiple selection
      quality: 0.5,
      base64: true, // Get base64 directly from picker
      selectionLimit: 4, // Optional: limit to 4 images
    });

    if (!res.canceled && res.assets) {
      try {
        const space = Math.max(0, 4 - form.images.length);

        // ✅ Use base64 directly from assets
        const newImages = res.assets.slice(0, space).map((asset) => {
          if (asset.base64) {
            return `data:image/jpeg;base64,${asset.base64}`;
          }
          return asset.uri; // Fallback to URI if base64 not available
        });

        setForm((p) => ({ ...p, images: [...p.images, ...newImages] }));
      } catch (error) {
        console.error("Error processing images:", error);
        Alert.alert("Error", "Failed to process images");
      }
    }
  };

  const removeImage = (idx: number) => {
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
  };

  const submit = async () => {
    Keyboard.dismiss();
    setSubmitted(true);

    if (!isValid) {
      console.log(
        "Validation Error",
        "Please fix all errors before submitting"
      );
      return;
    }

    const storedUserId = await getStoredUserId();
    if (!storedUserId) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setLoading(true);

    try {
      const apiType = form.type ? JOB_TYPE_DISPLAY[form.type] : "Full-time";

      // Match backend field names exactly
      const payload: Omit<JobListing, "id" | "created_at" | "updated_at"> = {
        shop_name: form.shopName.trim(),
        phone_number: form.phone.trim(),
        location: form.location.trim(),
        job_type: apiType,
        salary_text: form.salaryText.trim(),
        description: form.description.trim(),
        images: form.images,
        owner_id: storedUserId,
      };

      console.log("Sending payload:", payload);

      if (id) {
        await jobsStore.update(String(id), storedUserId, payload);
        Alert.alert("Success", "Job updated successfully!");
      } else {
        await jobsStore.add(payload);
        Alert.alert("Success", "Job posted successfully!");
      }

      router.back();
    } catch (error: any) {
      console.error("Error posting job:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error ||
          error.message ||
          "Failed to post job. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
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
              <Text style={styles.title}>{id ? "Edit Job" : "Post a Job"}</Text>
              <Text style={styles.subtitle}>
                Fill in the details below to post your job listing
              </Text>
            </View>
          </View>

          {/* Shop Name */}
          <Text style={styles.label}>
            Shop Name <Text style={{ color: "#DC2626" }}>*</Text>
          </Text>
          <View
            style={[
              styles.inputRow,
              focusField === "shopName" && styles.inputFocus,
              submitted && errors.shopName && styles.inputError,
            ]}
          >
            <Feather name="briefcase" size={16} color="#6B7280" />
            <TextInput
              accessibilityLabel="Shop Name"
              placeholder="The Gentleman's Cut, Modern Barber"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={form.shopName}
              onFocus={() => setFocusField("shopName")}
              onBlur={() => setFocusField(null)}
              onChangeText={(v) => setForm((p) => ({ ...p, shopName: v }))}
            />
          </View>
          {submitted && errors.shopName && (
            <View style={styles.errRow}>
              <Feather
                name="alert-circle"
                size={14}
                color="#DC2626"
                style={styles.errIcon}
              />
              <Text style={styles.err}>{errors.shopName}</Text>
            </View>
          )}

          {/* Phone */}
          <Text style={styles.label}>
            Contact Phone <Text style={{ color: "#DC2626" }}>*</Text>
          </Text>
          <View
            style={[
              styles.inputRow,
              focusField === "phone" && styles.inputFocus,
              submitted && errors.phone && styles.inputError,
            ]}
          >
            <Feather name="phone" size={16} color="#6B7280" />
            <TextInput
              accessibilityLabel="Contact phone"
              placeholder="+44 7123 456789"
              placeholderTextColor="#9CA3AF"
              keyboardType={
                Platform.select({
                  ios: "number-pad",
                  android: "phone-pad",
                  default: "phone-pad",
                }) as any
              }
              style={[
                styles.input,
                submitted && focusField === "phone" && styles.inputFocus,
                submitted && errors.phone && styles.inputError,
              ]}
              value={form.phone}
              onFocus={() => setFocusField("phone")}
              onBlur={() => setFocusField(null)}
              onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
            />
          </View>
          {submitted && errors.phone && (
            <View style={styles.errRow}>
              <Feather
                name="alert-circle"
                size={14}
                color="#DC2626"
                style={styles.errIcon}
              />
              <Text style={styles.err}>{errors.phone}</Text>
            </View>
          )}

          {/* Location */}
          <Text style={styles.label}>
            Location <Text style={{ color: "#DC2626" }}>*</Text>
          </Text>
          <View
            style={[
              styles.inputRow,
              focusField === "location" && styles.inputFocus,
              submitted && errors.location && styles.inputError,
            ]}
          >
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <TextInput
              accessibilityLabel="Location"
              placeholder="London, Camden"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={form.location}
              onFocus={() => setFocusField("location")}
              onBlur={() => setFocusField(null)}
              onChangeText={(v) => setForm((p) => ({ ...p, location: v }))}
            />
          </View>
          {submitted && errors.location && (
            <View style={styles.errRow}>
              <Feather
                name="alert-circle"
                size={14}
                color="#DC2626"
                style={styles.errIcon}
              />
              <Text style={styles.err}>{errors.location}</Text>
            </View>
          )}

          {/* Job Type */}
          <Text style={styles.label}>
            Job Type <Text style={{ color: "#DC2626" }}>*</Text>
          </Text>
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select job type"
              style={[
                styles.select,
                submitted && errors.type && submitted && styles.inputError,
              ]}
              onPress={() => setOpenType((v) => !v)}
            >
              <Text style={styles.selectLabel}>
                {form.type || "Select job type"}
              </Text>
              <Feather
                name={openType ? "chevron-up" : "chevron-down"}
                size={18}
                color="#6B7280"
              />
            </Pressable>
            {openType && (
              <View style={styles.dropdownMenu}>
                {JOB_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setForm((p) => ({ ...p, type: t }));
                      setOpenType(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {submitted && errors.type && (
            <View style={styles.errRow}>
              <Feather
                name="alert-circle"
                size={14}
                color="#DC2626"
                style={styles.errIcon}
              />
              <Text style={styles.err}>{errors.type}</Text>
            </View>
          )}

          {/* Salary */}
          <Text style={styles.label}>
            Salary/Pay <Text style={{ color: "#DC2626" }}>*</Text>
          </Text>
          <View
            style={[
              styles.inputRow,
              focusField === "salary" && styles.inputFocus,
              submitted && errors.salaryText && styles.inputError,
            ]}
          >
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>£</Text>
            <TextInput
              accessibilityLabel="Salary or pay"
              placeholder="25,000/year or 15/hour"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={form.salaryText}
              onFocus={() => setFocusField("salary")}
              onBlur={() => setFocusField(null)}
              onChangeText={(v) => setForm((p) => ({ ...p, salaryText: v }))}
            />
          </View>
          {submitted && errors.salaryText && (
            <View style={styles.errRow}>
              <Feather
                name="alert-circle"
                size={14}
                color="#DC2626"
                style={styles.errIcon}
              />
              <Text style={styles.err}>{errors.salaryText}</Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.label}>
            Job Description <Text style={{ color: "#DC2626" }}>*</Text>
          </Text>
          <TextInput
            accessibilityLabel="Job Description"
            placeholder="Describe the position, requirements, experience, hours, etc."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={5}
            style={[
              styles.textarea,
              focusField === "description" && styles.inputFocus,
              submitted && errors.description && styles.inputError,
            ]}
            value={form.description}
            onFocus={() => setFocusField("description")}
            onBlur={() => setFocusField(null)}
            onChangeText={(v) =>
              setForm((p) => ({ ...p, description: v.slice(0, 800) }))
            }
          />
          {submitted && errors.description && (
            <View style={styles.errRow}>
              <Feather
                name="alert-circle"
                size={14}
                color="#DC2626"
                style={styles.errIcon}
              />
              <Text style={styles.err}>{errors.description}</Text>
            </View>
          )}

          {/* Images */}
          <Text style={styles.label}>Shop Images (Optional)</Text>
          <Text style={styles.helper}>
            Add up to 3 photos of your shop to attract more applicants
          </Text>
          <View style={styles.imageBox}>
            <Pressable
              style={styles.imageAdd}
              onPress={pickImages}
              accessibilityRole="button"
              accessibilityLabel="Add photos"
            >
              <Feather name="camera" size={20} color="#6B7280" />
              <Text style={{ color: "#6B7280", marginTop: 6 }}>
                Click to add photos ({form.images.length}/3)
              </Text>
              <Text style={{ color: "#9CA3AF", marginTop: 2, fontSize: 12 }}>
                JPG, PNG up to 5MB each
              </Text>
            </Pressable>
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              {form.images.map((imgUri, i) => (
                <View key={i} style={{ marginRight: 10 }}>
                  <Image source={{ uri: imgUri }} style={styles.thumb} />
                  <Pressable
                    style={styles.remove}
                    onPress={() => removeImage(i)}
                    accessibilityLabel={`Remove photo ${i + 1}`}
                  >
                    <Feather name="x" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
          <View style={{ height: 96 }} />
        </ScrollView>

        {/* Sticky Footer CTA */}
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post Job"
            onPress={submit}
            disabled={loading}
            style={[styles.postBtn, loading && styles.postBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.postBtnText}>
                {id ? "Update Job" : "Post Job"}
              </Text>
            )}
          </Pressable>
          <Text style={styles.footerHelp}>
            Your job listing will be visible to barbers immediately
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
