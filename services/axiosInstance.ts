import axios from "axios";
import { Platform } from "react-native";


// Production config
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


// development config

/*const getBaseURL = () => {
  // Production
  if (process.env.NODE_ENV === "production") {
    return process.env.EXPO_PUBLIC_API_URL_PRODUCTION || "https://barbernet-backend-q8id.onrender.com/api";
  }
  
  // Development
  if (Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_API_URL_WEB || "http://localhost:8787/api";
  } else if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_API_URL_ANDROID || "http://10.0.2.2:8787/api";
  } else {
    // iOS and others - using your Mac IP
    return process.env.EXPO_PUBLIC_API_URL_IOS || "http://192.168.0.119:8787/api";
  }
};
*/

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