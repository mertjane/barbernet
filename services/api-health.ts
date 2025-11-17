import axiosInstance from "./axiosInstance";

export const pingBackend = async () => {
  try {
    console.log("🏓 Pinging backend to wake it up...");
    await axiosInstance.get("/health", { timeout: 5000 });
    console.log("✅ Backend is awake");
    return true;
  } catch (error) {
    console.log("⚠️ Backend is cold (will wake up on first request)");
    return false;
  }
};