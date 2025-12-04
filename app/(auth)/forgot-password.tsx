import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Flower2, ArrowLeft } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';

export default function ForgotPassword() {
  const [step, setStep] = useState<'phone' | 'otp' | 'reset'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      setStep('reset');
    }, 1000);
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      router.replace('/(auth)/login');
    }, 1000);
  };

  return (
    <LinearGradient
      colors={['#F8F9FF', '#E8E5FF', '#F8F9FF']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Flower2 size={60} color={theme.colors.primary} strokeWidth={1.5} />
            <Text style={styles.title}>
              {step === 'phone' && 'Forgot Password'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'reset' && 'Reset Password'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone' && 'Enter your phone number to receive OTP'}
              {step === 'otp' && 'Enter the 6-digit code sent to your phone'}
              {step === 'reset' && 'Create a new password for your account'}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 'phone' && (
              <>
                <Input
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button
                  title="Send OTP"
                  onPress={handleSendOTP}
                  loading={loading}
                  style={styles.button}
                />
              </>
            )}

            {step === 'otp' && (
              <>
                <Input
                  label="OTP Code"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCapitalize="none"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button
                  title="Verify OTP"
                  onPress={handleVerifyOTP}
                  loading={loading}
                  style={styles.button}
                />
                <TouchableOpacity onPress={handleSendOTP}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'reset' && (
              <>
                <Input
                  label="New Password"
                  placeholder="Enter new password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button
                  title="Reset Password"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={styles.button}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.xl,
    left: theme.spacing.lg,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  form: {
    width: '100%',
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: theme.spacing.md,
  },
  resendText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontWeight: '600',
  },
});
