import { Stack, useRouter, useSegments } from "expo-router";
import { Platform } from "react-native";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // Only run on web and only once
    if (Platform.OS === 'web' && !hasNavigated) {
      // Check if we're on root or index
      const isRoot = !segments[0] || segments[0] === 'index';
      
      if (isRoot) {
        console.log('🌐 Web detected, navigating to launch screen');
        router.replace('/launch-screen');
        setHasNavigated(true);
      }
    }
  }, [segments, hasNavigated]);


  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="launch-screen"
    >
      <Stack.Screen name="launch-screen" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="modal-post-job"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Post Job",
        }}
      />
      <Stack.Screen
        name="modal-add-barber"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Add Barber",
        }}
      />
      <Stack.Screen
        name="modal-job-detail"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Job Details",
        }}
      />
      <Stack.Screen
        name="modal-barber-detail"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Barber Profile",
        }}
      />
      <Stack.Screen
        name="modal-shop-detail"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Shop Details",
        }}
      />
    </Stack>
  );
}
