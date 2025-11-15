import axios from "axios";
import { Platform } from "react-native";

const getBaseURL = () => {
  // Check if we're in production (web deployment)
  const isProduction = process.env.NODE_ENV === "production" && Platform.OS === "web";
  
  if (isProduction) {
    return process.env.EXPO_PUBLIC_API_URL_PRODUCTION;
  }
  
  // Development URLs
  if (Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_API_URL_WEB;
  } else if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_API_URL_ANDROID;
  } else {
    return process.env.EXPO_PUBLIC_API_URL_IOS;
  }
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = ""; // e.g. get from AsyncStorage if using auth
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;