import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { Logo } from './Logo';

interface AuthModalProps {
  visible: boolean;
  isInitialSetup: boolean;
  onLogin: (password: string) => Promise<void>;
  onSetup: (name: string, email: string, password: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  isInitialSetup,
  onLogin,
  onSetup,
}) => {
  const [isSetupMode, setIsSetupMode] = useState(isInitialSetup);
  const [name, setName] = useState('Sarah Jenkins');
  const [email, setEmail] = useState('sarah.jenkins@timetrack.internal');
  const [password, setPassword] = useState('pass123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSetupMode) {
        if (!password || password.length < 4) {
          throw new Error('Password must be at least 4 characters.');
        }
        await onSetup(name, email, password);
      } else {
        await onLogin(password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.authCard}>
          <View style={styles.logoRow}>
            <Logo size={48} />
          </View>

          <Text style={styles.title}>
            {isSetupMode ? 'Setup Your Personal Tracker' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSetupMode
              ? 'Configure your single-user master account.'
              : 'Enter your master passcode to unlock TimeTrack.'}
          </Text>

          {errorMsg && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={theme.colors.tertiaryBright} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.form}>
            {isSetupMode && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputField}>
                    <MaterialIcons name="person" size={18} color={theme.colors.outline} />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      style={styles.textInput}
                      placeholder="Your Full Name"
                      placeholderTextColor={theme.colors.outline}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Work Email</Text>
                  <View style={styles.inputField}>
                    <MaterialIcons name="email" size={18} color={theme.colors.outline} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      style={styles.textInput}
                      placeholder="work.email@domain.com"
                      placeholderTextColor={theme.colors.outline}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Passcode</Text>
              <View style={styles.inputField}>
                <MaterialIcons name="lock" size={18} color={theme.colors.outline} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={styles.textInput}
                  placeholder="Master Passcode"
                  placeholderTextColor={theme.colors.outline}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {isSetupMode ? 'Create Personal Account' : 'Unlock Dashboard'}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {!isInitialSetup && (
              <TouchableOpacity
                onPress={() => {
                  setErrorMsg(null);
                  setIsSetupMode(!isSetupMode);
                }}
                style={styles.switchModeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.switchModeText}>
                  {isSetupMode ? 'Already have an account? Sign In' : 'First time? Setup Account'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  authCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.xl,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.onSurface,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.errorContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.tertiaryBright,
    fontWeight: '600',
    flex: 1,
  },
  form: {
    gap: 12,
    marginTop: 4,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputField: {
    height: 48,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(19, 27, 46, 0.08)',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  submitButton: {
    height: 50,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  switchModeBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
