import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
  },

  // ============================================
  // STYLES: Header/Branding Section
  // ============================================
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    
  },
  title: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "700",
    color: "#2F6061",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
    paddingHorizontal: 12,
  },

  // ============================================
  // STYLES: Email/Password Form Section
  // ============================================
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#2F6061",
    fontWeight: "600",
  },
  loginBtn: {
    backgroundColor: "#2F6061",
    marginTop: 8,
    padding: 14,
  },
  loginText: {
    color: "#FFFFFF",
  },

  // ============================================
  // STYLES: Divider Section
  // ============================================
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  // ============================================
  // STYLES: Social Login Buttons
  // ============================================
  socialButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16, // Added padding
  },
  icon: {
    marginRight: 8, // Changed from position absolute to margin
  },
  googleBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  googleText: {
    color: "#111827",
  },
  appleBtn: {
    backgroundColor: "#000000",
  },
  appleText: {
    color: "#FFFFFF",
  },
  btnText: {
    fontSize: 16,
    fontWeight: Platform.OS === "ios" ? "600" : "700",
  },

  // ============================================
  // STYLES: Register Section
  // ============================================
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  registerPrompt: {
    fontSize: 14,
    color: "#6B7280",
  },
  registerLink: {
    fontSize: 14,
    color: "#2F6061",
    fontWeight: "700",
  },

  // ============================================
  // STYLES: Legal Text
  // ============================================
  legal: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
  },
});