import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="launch-screen"
    >
      {/* Login Screen */}
      {/* <Stack.Screen name="index" /> */}
      {/* Register Screen */}
      {/* <Stack.Screen name="register" /> */}
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
