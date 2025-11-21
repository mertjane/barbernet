import axios from "axios";
import { Platform } from "react-native";

const getBaseURL = () => {
  // Always use production URL in production builds
  if (process.env.NODE_ENV === "production") {
    return process.env.EXPO_PUBLIC_API_URL_PRODUCTION || "https://barbernet-backend-q8id.onrender.com/api";
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
  timeout: 60000,
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