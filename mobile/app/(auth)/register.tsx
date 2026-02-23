import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize } from '../../constants/theme';

const SPORTS = [
  { id: 'Padel', name: 'Padel', icon: '🎾' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾' },
  { id: 'Running', name: 'Running', icon: '🏃' },
  { id: 'Soccer', name: 'Soccer', icon: '⚽' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀' },
  { id: 'Cycling', name: 'Cycling', icon: '🚴' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSport = (sportId: string) => {
    setSelectedSports(prev =>
      prev.includes(sportId) ? prev.filter(s => s !== sportId) : [...prev, sportId]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!displayName || !email || !password || !confirmPassword) {
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
      setError('');
      setStep(2);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      await register(email.trim(), password, displayName.trim());
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.branding}>
            <Text style={styles.logo}>TeamUp</Text>
            <Text style={styles.tagline}>
              {step === 1 ? 'Create your account' : 'Pick your sports'}
            </Text>
          </View>

          {/* Step indicator */}
          <View style={styles.steps}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {step === 1 ? (
            <View style={styles.form}>
              <Input
                label="Display Name"
                placeholder="Your name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
              <Input
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                isPassword
              />
              <Input
                label="Confirm Password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
              />
              <Button title="Next" onPress={handleNext} size="lg" />
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.sportsLabel}>Select your favorite sports:</Text>
              <View style={styles.sportsGrid}>
                {SPORTS.map(sport => (
                  <Pressable
                    key={sport.id}
                    style={[
                      styles.sportCard,
                      selectedSports.includes(sport.id) && styles.sportCardActive,
                    ]}
                    onPress={() => toggleSport(sport.id)}
                  >
                    <Text style={styles.sportCardIcon}>{sport.icon}</Text>
                    <Text
                      style={[
                        styles.sportCardText,
                        selectedSports.includes(sport.id) && styles.sportCardTextActive,
                      ]}
                    >
                      {sport.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.buttonRow}>
                <Button
                  title="Back"
                  onPress={() => setStep(1)}
                  variant="outline"
                  size="lg"
                  style={styles.backButton}
                />
                <Button
                  title="Create Account"
                  onPress={handleRegister}
                  loading={loading}
                  size="lg"
                  style={styles.createButton}
                />
              </View>
            </View>
          )}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  branding: { alignItems: 'center', marginBottom: Spacing.xxl },
  logo: { fontSize: FontSize.hero, fontWeight: '800', color: Colors.primary, letterSpacing: -1 },
  tagline: { fontSize: FontSize.lg, color: Colors.textSecondary, marginTop: Spacing.sm },
  steps: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  stepDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.surfaceLight,
  },
  stepDotActive: { backgroundColor: Colors.primary },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  form: { marginBottom: Spacing.xxl },
  errorText: {
    color: Colors.error, fontSize: FontSize.sm, textAlign: 'center',
    marginBottom: Spacing.lg, backgroundColor: Colors.errorBg,
    padding: Spacing.md, borderRadius: 8,
  },
  sportsLabel: {
    color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.lg,
  },
  sportsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  sportCard: {
    width: '30%', aspectRatio: 1, backgroundColor: Colors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  sportCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBgSubtle },
  sportCardIcon: { fontSize: 28 },
  sportCardText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500' },
  sportCardTextActive: { color: Colors.primary },
  buttonRow: { flexDirection: 'row', gap: Spacing.md },
  backButton: { flex: 1 },
  createButton: { flex: 2 },
  loginContainer: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: Colors.textSecondary, fontSize: FontSize.md },
  loginLink: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
