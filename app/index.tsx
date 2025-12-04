import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Flower2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (loading || showSplash) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && !inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!session && inAuthGroup) {
      return;
    } else if (!session) {
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments, showSplash]);

  if (showSplash || loading) {
    return (
      <LinearGradient
        colors={['#F8F9FF', '#E8E5FF', '#F8F9FF']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Flower2 size={80} color={theme.colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Flower Retail</Text>
          <Text style={styles.subtitle}>Smart Flower Retail Management</Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
