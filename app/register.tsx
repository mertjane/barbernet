import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useGoogleRequest,
  signInWithGoogleResponse,
  isFirstSession,
} from "../services/auth.service";
import * as AppleAuthentication from "expo-apple-authentication";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirebaseAuth } from "../config/firebase-config";
import { OAuthProvider, signInWithCredential } from "firebase/auth";
import { markEntered } from "../lib/session";
import { styles } from "@/styles/_register.styles";
import { registerUserInDB } from "../services/auth.api";
import { userStore } from "@/lib/user-store";

export default function RegisterScreen() {
  const router = useRouter();
  const { response, promptAsync } = useGoogleRequest();
  const [loading, setLoading] = useState(false);

  // ============================================
  // STATE: Email, Password & Confirm Password Input Fields
  // ============================================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEmailRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const auth = getFirebaseAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: email.split("@")[0],
      });

      // Update local store
      userStore.update({
        name: user.displayName || email.split("@")[0],
        email: user.email || "",
        phone: user.phoneNumber || "",
        photo: require("../assets/images/brandlogo.png"),
      });

      // ✅ Send Firebase user info to backend (Neon DB) 
      await registerUserInDB({
        id: user.uid, // Firebase UUID as primary ID
        name: user.displayName || email.split("@")[0],
        email: user.email || "",
        phone: user.phoneNumber || "",
        photo: undefined,
      });

      // Continue app flow
      await markEntered();
      Alert.alert("Success", "Account created successfully!");
      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error("Firebase registration error:", error);
      let message = "Failed to register";

      if (error.code === "auth/email-already-in-use") {
        message = "This email is already in use";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak";
      }

      Alert.alert("Registration Error", message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLER: Navigate to Login
  // ============================================
  const handleNavigateToLogin = () => {
    router.back();
  };

  // ============================================
  // HANDLER: Google Sign-In
  // ============================================
  React.useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn();
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const userCredential = await signInWithGoogleResponse(response);
      const user = userCredential.user;

      // Update user store with Google data
      userStore.update({
        name: user.displayName || "User",
        email: user.email || "",
        phone: user.phoneNumber || "",
        photo: user.photoURL
          ? { uri: user.photoURL }
          : require("../assets/images/brandlogo.png"),
      });

      await markEntered();

      // Navigate based on first session
      if (isFirstSession(user)) {
        console.log("First time user!");
        router.replace("/(tabs)/home");
      } else {
        console.log("Returning user!");
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      Alert.alert(
        "Sign In Error",
        error.message || "Failed to sign in with Google"
      );
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    try {
      setLoading(true);
      await promptAsync();
    } catch (error: any) {
      console.error("Error prompting Google sign-in:", error);
      Alert.alert("Error", "Failed to start Google sign-in");
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

      // Update user store with Apple data
      const displayName = fullName
        ? `${fullName.givenName || ""} ${fullName.familyName || ""}`.trim()
        : user.displayName || "User";

      userStore.update({
        name: displayName,
        email: email || user.email || "",
        phone: user.phoneNumber || "",
        photo: user.photoURL
          ? { uri: user.photoURL }
          : require("../assets/images/brandlogo.png"),
      });

      await markEntered();

      if (isFirstSession(user)) {
        console.log("First time Apple user!");
        router.replace("/(tabs)/home");
      } else {
        console.log("Returning Apple user!");
        router.replace("/(tabs)/home");
      }
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
              source={require("../assets/images/brandlogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>BarberNet</Text>
            <Text style={styles.subtitle}>
              Join the UK's leading barber community
            </Text>
          </View>

          {/* ============================================ */}
          {/* SECTION: Registration Form */}
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

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Register Button */}
            <Pressable
              onPress={handleEmailRegister}
              style={[styles.button, styles.registerBtn]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.btnText, styles.registerText]}>
                  Register
                </Text>
              )}
            </Pressable>
          </View>

          {/* ============================================ */}
          {/* SECTION: Divider "or signup with" */}
          {/* ============================================ */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or signup with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ============================================ */}
          {/* SECTION: Social Login Buttons */}
          {/* ============================================ */}
          <View style={styles.socialButtons}>
            {/* Google Button */}
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

            {/* Apple Button */}
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
          </View>

          {/* ============================================ */}
          {/* SECTION: Login Link */}
          {/* ============================================ */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginPrompt}>Have an account already? </Text>
            <Pressable onPress={handleNavigateToLogin}>
              <Text style={styles.loginLink}>Login</Text>
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
