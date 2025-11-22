import React, { useEffect, useState } from "react";
import { styles } from "@/styles/_login.styles";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Image,
  View,
  Text,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  clearEntered,
  getStoredUserId,
  hasEntered,
  markEntered,
} from "../lib/session";
import * as AppleAuthentication from "expo-apple-authentication";
import { getFirebaseAuth } from "../config/firebase-config";
import { userStore } from "../lib/user-store";
import {
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { registerUserInDB } from "@/services/auth.api";
import { getUserById } from "@/services/user.api";
import { handleGoogleSignIn } from "@/services/google-auth.service";
import LaunchScreen from "./launch-screen";
import { pingBackend } from "@/services/api-health";

export default function Index() {
  const router = useRouter();

  /* const { request, response, promptAsync } = useGoogleRequest(); */
  const [loading, setLoading] = useState(false);
  const [_appleAvailable, setAppleAvailable] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLaunchScreen, setShowLaunchScreen] = useState<boolean>(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 Starting auth check...");

        if (Platform.OS === "web" && process.env.NODE_ENV === "production") {
          pingBackend();
        }

        // ✅ Check if we have a stored user ID
        const storedUserId = await getStoredUserId();
        const seen = await hasEntered();

        console.log("💾 Stored user ID:", storedUserId, "Session:", seen);

        if (storedUserId && seen) {
          // ✅ We have a stored session, load user directly
          try {
            const userData = await getUserById(storedUserId);
            const userForStore = {
              id: storedUserId,
              name: userData.name || "User",
              email: userData.email || "",
              phone: userData.phone || "",
              photo: userData.photo ? { uri: userData.photo } : null,
            };
            userStore.update(userForStore);
            console.log("✅ User loaded from stored session");

            setTimeout(() => {
              setShowLaunchScreen(false);
              setIsCheckingAuth(false);
              router.replace("/(tabs)/home");
            }, 2500);
            return; // ✅ Exit early, don't wait for Firebase
          } catch (error) {
            console.error("❌ Error loading stored user:", error);
            await clearEntered();
          }
        }

        // ✅ No stored session, wait for Firebase or show login
        setTimeout(() => {
          setShowLaunchScreen(false);
          setIsCheckingAuth(false);
        }, 2500);

        if (Platform.OS === "ios") {
          const isAvailable = await AppleAuthentication.isAvailableAsync();
          setAppleAvailable(isAvailable);
        }
      } catch (error) {
        console.error("❌ Auth check error:", error);
        setTimeout(() => {
          setShowLaunchScreen(false);
          setIsCheckingAuth(false);
        }, 2500);
      }
    };

    checkAuth();
  }, []);

  // Show launch screen for all platforms
  if (showLaunchScreen) {
    return <LaunchScreen />;
  }

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // ============================================
  // HANDLER: Email/Password Login
  // ============================================
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      setLoading(true);

      // Get Firebase Auth instance
      const auth = getFirebaseAuth();

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Firebase users have 'uid', not 'id'
      const userId = user.uid;

      console.log("Firebase User UID:", userId); // Debug log

      // Try to fetch user from DB first
      let userData;
      try {
        userData = await getUserById(userId);
        console.log("Existing user found:", userData);
      } catch (error) {
        // User doesn't exist in DB, create them
        console.log("User not found in DB, creating...");
        await registerUserInDB({
          id: userId, // Use Firebase UID
          name: user.displayName || "User",
          email: user.email || "",
          phone: user.phoneNumber || "",
          photo: user.photoURL || undefined,
        });
        // Fetch again after creating
        userData = await getUserById(userId);
      }

      // Firebase UID to local store
      const userForStore = {
        id: userId, // Use Firebase UID, not email!
        name: userData.name || "User",
        email: userData.email || "",
        phone: userData.phone || "",
        photo: userData.photo ? { uri: userData.photo } : null,
      };

      console.log("Saving user to store:", userForStore); // Debug log

      // Update local store
      userStore.update(userForStore);

      // Verify it was saved
      const savedUser = userStore.get();
      console.log("User store after update:", savedUser); // Debug log

      // Mark session
      await markEntered(userId);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "Failed to login";

      if (error.code === "auth/user-not-found") message = "User not found";
      else if (error.code === "auth/wrong-password") message = "Wrong password";
      else if (error.code === "auth/invalid-email") message = "Invalid email";

      Alert.alert("Login Error", message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLER: Forgot Password
  // ============================================
  const handleForgotPassword = () => {
    // TODO: Navigate to password reset screen or show reset modal
    Alert.alert("Forgot Password", "Password reset not yet implemented");
  };

  // ============================================
  // HANDLER: Navigate to Register
  // ============================================
  const handleNavigateToRegister = () => {
    router.push("/register");
  };

  // Updated onGoogle function
  const onGoogle = async () => {
    try {
      setLoading(true);
      const userCredential = await handleGoogleSignIn(); // Uses smart detection
      const user = userCredential.user;
      const userId = user.uid;

      let userData;
      try {
        userData = await getUserById(userId);
      } catch (error) {
        await registerUserInDB({
          id: userId,
          name: user.displayName || "User",
          email: user.email || "",
          phone: user.phoneNumber || "",
          photo: user.photoURL || undefined,
        });
        userData = await getUserById(userId);
      }

      const userForStore = {
        id: userId,
        name: userData.name || "User",
        email: userData.email || "",
        phone: userData.phone || "",
        photo: userData.photo ? { uri: userData.photo } : null,
      };

      userStore.update(userForStore);
      await markEntered(userId);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      if (error.message !== "Google Sign-In not available in Expo Go") {
        Alert.alert(
          "Sign In Error",
          error.message || "Failed to sign in with Google"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLER: Apple Sign-In
  // ============================================
  const onApple = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, fullName, email } = credential;

      if (!identityToken) {
        throw new Error("No identity token received");
      }

      // Create Firebase credential
      const provider = new OAuthProvider("apple.com");
      const authCredential = provider.credential({
        idToken: identityToken,
      });

      const auth = getFirebaseAuth();
      const userCredential = await signInWithCredential(auth, authCredential);
      const user = userCredential.user;

      // Firebase users have 'uid', not 'id'
      const userId = user.uid;

      console.log("Apple Firebase User UID:", userId); // Debug log

      // Try to fetch user from DB first
      let userData;
      try {
        userData = await getUserById(userId);
        console.log("Existing Apple user found:", userData);
      } catch (error) {
        // User doesn't exist in DB, create them
        console.log("Apple user not found in DB, creating...");

        const displayName = fullName
          ? `${fullName.givenName || ""} ${fullName.familyName || ""}`.trim()
          : user.displayName || "User";

        await registerUserInDB({
          id: userId, // Use Firebase UID
          name: displayName,
          email: email || user.email || "",
          phone: user.phoneNumber || "",
          photo: user.photoURL || undefined,
        });

        // Fetch again after creating
        userData = await getUserById(userId);
      }

      // ✅ Update user store with Firebase UID
      const userForStore = {
        id: userId, // Use Firebase UID, not email!
        name: userData.name || "User",
        email: userData.email || "",
        phone: userData.phone || "",
        photo: userData.photo ? { uri: userData.photo } : null,
      };

      console.log("Saving Apple user to store:", userForStore); // Debug log
      userStore.update(userForStore);

      await markEntered(userId);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        setLoading(false);
        return;
      }
      console.error("Apple sign-in error:", error);
      Alert.alert(
        "Sign In Error",
        error.message || "Failed to sign in with Apple"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* ============================================ */}
          {/* SECTION: App Logo & Branding */}
          {/* ============================================ */}
          <View style={styles.header}>
            <Image
              source={require("../assets/images/brand-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>BarberNet</Text>
            <Text style={styles.subtitle}>
              Connect barbers, shops, and suppliers across the UK
            </Text>
          </View>

          {/* ============================================ */}
          {/* SECTION: Email & Password Login Form */}
          {/* ============================================ */}
          <View style={styles.formSection}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Forgot Password Link */}
            <Pressable
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>

            {/* Login Button */}
            <Pressable
              onPress={handleEmailLogin}
              style={[styles.button, styles.loginBtn]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.btnText, styles.loginText]}>Login</Text>
              )}
            </Pressable>
          </View>

          {/* ============================================ */}
          {/* SECTION: Divider "or continue with" */}
          {/* ============================================ */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ============================================ */}
          {/* SECTION: Social Login Buttons */}
          {/* ============================================ */}
          <View style={styles.socialButtons}>
            <Pressable
              onPress={onGoogle}
              style={[styles.button, styles.googleBtn]}
              disabled={loading}
            >
              <AntDesign
                name="google"
                size={18}
                color="#4285F4"
                style={styles.icon}
              />
              <Text style={[styles.btnText, styles.googleText]}>Google</Text>
            </Pressable>

            {Platform.OS === "ios" && (
              <Pressable
                onPress={onApple}
                style={[styles.button, styles.appleBtn]}
                disabled={loading}
              >
                <FontAwesome
                  name="apple"
                  size={18}
                  color="#FFFFFF"
                  style={styles.icon}
                />
                <Text style={[styles.btnText, styles.appleText]}>Apple</Text>
              </Pressable>
            )}
          </View>
          {/* ============================================ */}
          {/* SECTION: Register Link */}
          {/* ============================================ */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <Pressable onPress={handleNavigateToRegister}>
              <Text style={styles.registerLink}>Register</Text>
            </Pressable>
          </View>
          {/* ============================================ */}
          {/* SECTION: Legal Text */}
          {/* ============================================ */}
          <Text style={styles.legal}>
            By continuing, you agree to our Terms & Privacy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
