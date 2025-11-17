import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { hasEntered } from "../lib/session";

export default function LaunchScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 2.5 seconds
    const timer = setTimeout(async () => {
      const seen = await hasEntered();
      if (seen) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = Platform.OS === 'web' 
    ? {} // Skip animations on web if causing issues
    : {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      };


  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          animatedStyle,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Circle */}
        <View style={styles.logoCircle}>
          <Image
            source={require("../assets/images/brand-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>BarberNet</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>UK Barber Network</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Connecting barbers, shops & suppliers
        </Text>

        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </Animated.View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  logo: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
    fontWeight: '500',
  },
  tagline: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.4,
  },
  dotActive: {
    opacity: 1,
  },
});
