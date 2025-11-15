import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { clearEntered } from "../../lib/session";
import * as ImagePicker from "expo-image-picker";
import { userStore, type UserProfile } from "../../lib/user-store";
import { jobsStore, type JobListing as StoreJob } from "../../lib/jobs-store";
import {
  barbersStore,
  type BarberProfile as StoreBarber,
} from "../../lib/barbers-store";
import {
  shopsStore,
  type ShopListing as StoreShop,
} from "../../lib/shops-store";
import { getFirebaseAuth } from "@/config/firebase-config";
import { getUserById, updateUserApi } from "@/services/user.api";

type Mode = "view" | "edit";

export default function ProfileScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("view");
  const [user, setUser] = useState<UserProfile>(userStore.get());
  const [jobs, setJobs] = useState<StoreJob[]>(jobsStore.get());
  const [barbers, setBarbers] = useState<StoreBarber[]>(barbersStore.get());
  const [shops, setShops] = useState<StoreShop[]>(shopsStore.get());
  const isView = mode === "view";

  const auth = getFirebaseAuth();

  // ✅ Fetch user data from backend DB instead of Firebase Auth
  useEffect(() => {
    const loadUserData = async () => {
      if (auth.currentUser) {
        try {
          // Fetch from backend DB
          const userData = await getUserById(auth.currentUser.uid);

          const u: UserProfile = {
            id: userData.id,
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            photo: userData.photo ? { uri: userData.photo } : null,
          };

          userStore.update(u);
          setUser(u);
        } catch (error) {
          console.error("Error loading user data:", error);
          // Fallback to Firebase data if DB fetch fails
          const u: UserProfile = {
            id: auth.currentUser.uid,
            name: auth.currentUser.displayName || "",
            email: auth.currentUser.email || "",
            phone: auth.currentUser.phoneNumber || "",
            photo: auth.currentUser.photoURL
              ? { uri: auth.currentUser.photoURL }
              : null,
          };
          userStore.update(u);
          setUser(u);
        }
      }
    };

    loadUserData();
  }, []);

  const canSave = useMemo(() => {
    const emailOk = !!user.email && /.+@.+\..+/.test(user.email);
    const phoneOk = !user.phone || /^\+?\d[\d\s]{6,}$/.test(user.phone);
    const nameOk = !!user.name && user.name.trim().length >= 2;
    return emailOk && phoneOk && nameOk;
  }, [user]);

  const onEditToggle = () => {
    if (isView) {
      setMode("edit");
    } else {
      setMode("view");
    }
  };

  const onSave = async () => {
    if (!canSave) return;
    try {
      // Call backend API
      const updatedUser = await updateUserApi({
        id: auth.currentUser?.uid || "", // use Firebase UID
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo?.uri,
      });

      // Convert backend photo string into frontend shape
      const userForStore: UserProfile = {
        ...updatedUser,
        photo: updatedUser.photo ? { uri: updatedUser.photo } : null,
      };

      // Update local state/store
      setUser(userForStore);
      userStore.update(userForStore);

      setMode("view");
      Alert.alert("Profile Updated", "Your changes have been saved.");
    } catch (err: any) {
      Alert.alert("Update Failed", err.message || "Something went wrong");
    }
  };

  const onCancel = () => {
    setMode("view");
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // Updated from deprecated MediaTypeOptions
      quality: 0.5, // Reduced quality to keep size smaller
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      try {
        const imageUri = res.assets[0].uri;

        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: "base64",
        });

        // Create data URI
        const base64Uri = `data:image/jpeg;base64,${base64}`;

        setUser((prev) => ({ ...prev, photo: { uri: base64Uri } }));

        if (isView) {
          setMode("edit");
        }
      } catch (error) {
        console.error("Error converting image:", error);
        Alert.alert("Error", "Failed to process image");
      }
    }
  };

  const onSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await clearEntered();
          router.replace("/");
        },
      },
    ]);
  };

  useEffect(() => {
    const unsubUser = userStore.subscribe(() => setUser(userStore.get()));
    const unsubJobs = jobsStore.subscribe(() => setJobs(jobsStore.get()));
    const unsubBarbers = barbersStore.subscribe(() =>
      setBarbers(barbersStore.get())
    );
    const unsubShops = shopsStore.subscribe(() => setShops(shopsStore.get()));
    return () => {
      unsubUser();
      unsubJobs();
      unsubBarbers();
      unsubShops();
    };
  }, []);

  const me = user.id;
  const myJobs = useMemo(
    () => jobs.filter((j) => j.owner_id === me),
    [jobs, me]
  );
  const myBarbers = useMemo(
    () => barbers.filter((b) => b.owner_id === me),
    [barbers, me]
  );
  const myShops = useMemo(
    () => shops.filter((s) => s.owner_id === me),
    [shops, me]
  );
  const [myTab, setMyTab] = useState<"jobs" | "shops" | "barbers">("jobs");

  const confirmDeleteJob = (job: StoreJob) => {
    Alert.alert("Delete Job", "Are you sure you want to delete this job?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => jobsStore.remove(job.id, job.owner_id),
      },
    ]);
  };

  const confirmDeleteBarber = (barber: StoreBarber) => {
    Alert.alert(
      "Delete Barber Profile",
      "Are you sure you want to delete this profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => barbersStore.remove(barber.id, barber.owner_id),
        },
      ]
    );
  };

  const confirmDeleteShop = (id: string, owner_id: string) => {
    Alert.alert(
      "Delete Shop",
      "Are you sure you want to delete this shop listing?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => shopsStore.remove(id, owner_id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Profile</Text>

        <View style={styles.avatarWrap}>
          <Image
            source={
              user.photo
                ? { uri: user.photo.uri } // always use object with uri
                : require("../../assets/images/default-avatar.png")
            }
            style={styles.avatar}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            style={styles.camBadge}
            onPress={pickPhoto}
          >
            <Feather name="camera" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {isView ? (
          <Pressable
            style={[styles.primaryBtn, styles.primaryBtnSolo]}
            onPress={onEditToggle}
          >
            <Text style={styles.primaryBtnText}>Edit Profile</Text>
          </Pressable>
        ) : (
          <View style={styles.rowBtns}>
            <Pressable style={[styles.secondaryBtn]} onPress={onCancel}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, !canSave && styles.btnDisabled]}
              disabled={!canSave}
              onPress={onSave}
            >
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.label}>Name</Text>
        <TextInput
          editable={!isView}
          value={isView ? user.name : user.name}
          onChangeText={(v) => setUser((p) => ({ ...p, name: v }))}
          style={[styles.input, isView ? styles.inputView : null]}
          placeholder="Your Name"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          editable={!isView}
          keyboardType={
            Platform.select({
              ios: "number-pad",
              android: "phone-pad",
              default: "phone-pad",
            }) as any
          }
          value={isView ? user.phone : user.phone}
          onChangeText={(v) => setUser((p) => ({ ...p, phone: v }))}
          style={[styles.input, isView ? styles.inputView : null]}
          placeholder="+44 7xxx xxxxxx"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          editable={!isView}
          autoCapitalize="none"
          keyboardType="email-address"
          value={isView ? user.email : user.email}
          onChangeText={(v) => setUser((p) => ({ ...p, email: v }))}
          style={[styles.input, isView ? styles.inputView : null]}
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
        />

        {/* My Listings */}
        <Text style={[styles.header, { marginTop: 40 }]}>My Listings</Text>

        {/* Segmented control */}
        <View style={styles.segmentWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="My Jobs"
            onPress={() => setMyTab("jobs")}
            style={[styles.segment, myTab === "jobs" && styles.segmentOn]}
          >
            <Text
              style={[
                styles.segmentText,
                myTab === "jobs" && styles.segmentTextOn,
              ]}
            >
              Jobs ({myJobs.length})
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="My Shops"
            onPress={() => setMyTab("shops")}
            style={[styles.segment, myTab === "shops" && styles.segmentOn]}
          >
            <Text
              style={[
                styles.segmentText,
                myTab === "shops" && styles.segmentTextOn,
              ]}
            >
              Shops ({myShops.length})
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="My Barbers"
            onPress={() => setMyTab("barbers")}
            style={[styles.segment, myTab === "barbers" && styles.segmentOn]}
          >
            <Text
              style={[
                styles.segmentText,
                myTab === "barbers" && styles.segmentTextOn,
              ]}
            >
              Barbers ({myBarbers.length})
            </Text>
          </Pressable>
        </View>

        {/* Selected list */}
        {myTab === "jobs" &&
          (myJobs.length === 0 ? (
            <Text style={styles.emptyText}>No jobs posted yet.</Text>
          ) : (
            myJobs.map((j) => (
              <View key={j.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{j.shop_name || "Job"}</Text>
                  <Text style={styles.itemSub}>{j.location}</Text>
                </View>
                <Pressable
                  style={styles.itemBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/modal-post-job",
                      params: { id: j.id },
                    })
                  }
                >
                  <Text style={styles.itemBtnText}>Edit</Text>
                </Pressable>
                <View style={{ width: 8 }} />
                <Pressable
                  style={[styles.itemBtn, styles.itemBtnDanger]}
                  onPress={() => confirmDeleteJob(j)}
                >
                  <Text style={[styles.itemBtnText, styles.itemBtnDangerText]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            ))
          ))}
        {myTab === "shops" &&
          (myShops.length === 0 ? (
            <Text style={styles.emptyText}>No shops listed yet.</Text>
          ) : (
            myShops.map((s) => (
              <View key={s.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{s.shop_name}</Text>
                  <Text style={styles.itemSub}>{s.location}</Text>
                </View>
                <Pressable
                  style={styles.itemBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/modal-list-shop",
                      params: { id: s.id },
                    })
                  }
                >
                  <Text style={styles.itemBtnText}>Edit</Text>
                </Pressable>
                <View style={{ width: 8 }} />
                <Pressable
                  style={[styles.itemBtn, styles.itemBtnDanger]}
                  onPress={() => confirmDeleteShop(s.id, s.owner_id)}
                >
                  <Text style={[styles.itemBtnText, styles.itemBtnDangerText]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            ))
          ))}
        {myTab === "barbers" &&
          (myBarbers.length === 0 ? (
            <Text style={styles.emptyText}>No barber profiles yet.</Text>
          ) : (
            myBarbers.map((b) => (
              <View key={b.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{b.full_name}</Text>
                  <Text style={styles.itemSub}>{b.city}</Text>
                </View>
                <Pressable
                  style={styles.itemBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/modal-add-barber",
                      params: { id: String(b.id) },
                    })
                  }
                >
                  <Text style={styles.itemBtnText}>Edit</Text>
                </Pressable>
                <View style={{ width: 8 }} />
                <Pressable
                  style={[styles.itemBtn, styles.itemBtnDanger]}
                  onPress={() => confirmDeleteBarber(b)}
                >
                  <Text style={[styles.itemBtnText, styles.itemBtnDangerText]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            ))
          ))}

        <Pressable style={styles.signOutBtn} onPress={onSignOut}>
          <Feather name="log-out" size={16} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        {/* Footer Section */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} BarberNet. All rights reserved.
          </Text>
          <Text style={styles.footerTagline}>
            Connecting barbers with opportunities
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { paddingHorizontal: 16, paddingVertical: 24 },
  header: {
    fontSize: 20,
    fontWeight: "400",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },

  avatarWrap: {
    alignSelf: "center",
    width: 140,
    height: 140,
    marginTop: 4,
    marginBottom: 12,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 70 },
  camBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginTop: Platform.select({ ios: -1, android: 0, default: 0 }) as number,
  },
  primaryBtnSolo: { marginTop: 4, marginBottom: 12 },
  rowBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    marginTop: Platform.select({ ios: 2, android: 0, default: 0 }) as number,
  },
  secondaryBtnText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 44,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 44,
  },
  btnDisabled: { opacity: 0.6 },

  label: { marginTop: 8, marginBottom: 6, color: "#111827", fontWeight: "600" },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },
  inputView: { backgroundColor: "#F3F4F6" },

  signOutBtn: {
    marginTop: 56,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  signOutText: { color: "#DC2626", fontWeight: "700", marginLeft: 8 },
  sectionHdr: {
    marginTop: 6,
    marginBottom: 6,
    color: "#111827",
    fontWeight: "700",
  },
  emptyText: { color: "#6B7280", fontSize: 12, marginBottom: 6 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  itemTitle: { color: "#111827", fontWeight: "700" },
  itemSub: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  itemBtn: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  itemBtnText: { color: "#111827", fontWeight: "700", fontSize: 12 },
  itemBtnDanger: { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
  itemBtnDangerText: { color: "#B91C1C" },
  segmentWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    padding: 4,
    marginTop: 10,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentOn: { backgroundColor: "#FFFFFF" },
  segmentText: { color: "#374151", fontWeight: "600", fontSize: 13 },
  segmentTextOn: { color: "#111827" },

  // Footer styles
  footer: {
    marginTop: 24,
    paddingTop: 24,
    alignItems: "center",
  },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  footerVersion: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  footerTagline: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
