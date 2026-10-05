import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { Logo } from './Logo';

export const AVATAR_PRESETS = [
  { id: 'av1', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { id: 'av2', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { id: 'av3', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
  { id: 'av4', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
  { id: 'av5', uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { id: 'av6', uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
];

interface AuthModalProps {
  visible: boolean;
  isInitialSetup: boolean;
  onLogin: (password: string) => Promise<void>;
  onSetup: (
    name: string,
    email: string,
    password: string,
    avatar: string,
    shiftSettings: {
      workStartTime: string;
      workEndTime: string;
      lunchMinutes: number;
      bufferMinutes: number;
      requiredProductiveMinutes: number;
    }
  ) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  isInitialSetup,
  onLogin,
  onSetup,
}) => {
  const [isSetupMode, setIsSetupMode] = useState(isInitialSetup);

  // Setup form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].uri);
  const [workStartTime, setWorkStartTime] = useState('10:00');
  const [workEndTime, setWorkEndTime] = useState('19:00');
  const [lunchMinutes, setLunchMinutes] = useState(60);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSetupMode(isInitialSetup);
  }, [isInitialSetup]);

  // Compute required productive minutes dynamically
  const parseHourMinute = (timeStr: string): number => {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const startMins = parseHourMinute(workStartTime);
  const endMins = parseHourMinute(workEndTime);
  const totalShiftMins = Math.max(0, endMins - startMins);
  const requiredProductiveMinutes = Math.max(60, totalShiftMins - lunchMinutes - bufferMinutes);
  const targetHours = Math.floor(requiredProductiveMinutes / 60);
  const targetRemainderMins = requiredProductiveMinutes % 60;
  const targetStr = `${targetHours}h ${targetRemainderMins.toString().padStart(2, '0')}m`;

  const handleSubmit = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSetupMode) {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!password || password.length < 4) {
          throw new Error('Please set a passcode of at least 4 digits/characters.');
        }

        await onSetup(name.trim(), email.trim(), password, selectedAvatar, {
          workStartTime,
          workEndTime,
          lunchMinutes,
          bufferMinutes,
          requiredProductiveMinutes,
        });
      } else {
        if (!password) {
          throw new Error('Please enter your passcode.');
        }
        await onLogin(password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Logo size={44} />
            </View>
            <Text style={styles.title}>
              {isSetupMode ? 'Initial Tracker Setup' : 'Unlock Your Tracker'}
            </Text>
            <Text style={styles.subtitle}>
              {isSetupMode
                ? 'Welcome! Configure your personal attendance profile and shift parameters. All data is saved 100% locally on your phone.'
                : 'Enter your master passcode to unlock TimeTrack.'}
            </Text>
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={18} color="#D52022" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {isSetupMode ? (
            /* ================= INITIAL SETUP FORM ================= */
            <View style={styles.sectionWrap}>
              {/* 1. Profile Information */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialIcons name="person" size={20} color={theme.colors.primary} />
                  <Text style={styles.cardTitle}>1. Personal Profile</Text>
                </View>

                {/* Avatar Preview & Selector */}
                <View style={styles.avatarSection}>
                  <Image source={{ uri: selectedAvatar }} style={styles.avatarPreview} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Select Your Profile Photo</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarPickerRow}>
                      {AVATAR_PRESETS.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.avatarThumbWrap,
                            selectedAvatar === item.uri && styles.avatarThumbSelected,
                          ]}
                          onPress={() => setSelectedAvatar(item.uri)}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: item.uri }} style={styles.avatarThumb} />
                          {selectedAvatar === item.uri && (
                            <View style={styles.avatarCheckmark}>
                              <MaterialIcons name="check" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Your Full Name *</Text>
                  <View style={styles.inputField}>
                    <MaterialIcons name="badge" size={18} color={theme.colors.outline} />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      style={styles.textInput}
                      placeholder="e.g. Sujay Kumar Kotal"
                      placeholderTextColor={theme.colors.outline}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Work Email (Optional)</Text>
                  <View style={styles.inputField}>
                    <MaterialIcons name="email" size={18} color={theme.colors.outline} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      style={styles.textInput}
                      placeholder="e.g. sujay@company.com"
                      placeholderTextColor={theme.colors.outline}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>

              {/* 2. Official Shift Settings */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialIcons name="schedule" size={20} color={theme.colors.primary} />
                  <Text style={styles.cardTitle}>2. Official Shift Window</Text>
                </View>

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Shift Start (24h)</Text>
                    <View style={styles.inputField}>
                      <TextInput
                        value={workStartTime}
                        onChangeText={setWorkStartTime}
                        style={styles.textInput}
                        placeholder="10:00"
                        placeholderTextColor={theme.colors.outline}
                      />
                    </View>
                    <View style={styles.pillRow}>
                      {['09:00', '09:30', '10:00'].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.smallPill, workStartTime === t && styles.smallPillActive]}
                          onPress={() => setWorkStartTime(t)}
                        >
                          <Text style={[styles.smallPillText, workStartTime === t && styles.smallPillTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Shift End (24h)</Text>
                    <View style={styles.inputField}>
                      <TextInput
                        value={workEndTime}
                        onChangeText={setWorkEndTime}
                        style={styles.textInput}
                        placeholder="19:00"
                        placeholderTextColor={theme.colors.outline}
                      />
                    </View>
                    <View style={styles.pillRow}>
                      {['18:00', '18:30', '19:00'].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.smallPill, workEndTime === t && styles.smallPillActive]}
                          onPress={() => setWorkEndTime(t)}
                        >
                          <Text style={[styles.smallPillText, workEndTime === t && styles.smallPillTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Lunch & Buffer */}
                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Lunch Pause</Text>
                    <View style={styles.pillRow}>
                      {[30, 45, 60].map((mins) => (
                        <TouchableOpacity
                          key={mins}
                          style={[styles.smallPill, lunchMinutes === mins && styles.smallPillActive]}
                          onPress={() => setLunchMinutes(mins)}
                        >
                          <Text style={[styles.smallPillText, lunchMinutes === mins && styles.smallPillTextActive]}>{mins}m</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Comfort Buffer</Text>
                    <View style={styles.pillRow}>
                      {[0, 10, 15].map((mins) => (
                        <TouchableOpacity
                          key={mins}
                          style={[styles.smallPill, bufferMinutes === mins && styles.smallPillActive]}
                          onPress={() => setBufferMinutes(mins)}
                        >
                          <Text style={[styles.smallPillText, bufferMinutes === mins && styles.smallPillTextActive]}>{mins}m</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Live Target Calculation banner */}
                <View style={styles.targetBanner}>
                  <MaterialIcons name="speed" size={18} color={theme.colors.secondaryBright} />
                  <Text style={styles.targetBannerText}>
                    Required Daily Productive Target:{' '}
                    <Text style={{ fontWeight: '800', color: theme.colors.primary }}>{targetStr}</Text>
                  </Text>
                </View>
              </View>

              {/* 3. Passcode */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <MaterialIcons name="lock" size={20} color={theme.colors.primary} />
                  <Text style={styles.cardTitle}>3. Security Passcode</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Create a Passcode (Min 4 digits) *</Text>
                  <View style={styles.inputField}>
                    <MaterialIcons name="security" size={18} color={theme.colors.outline} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      style={styles.textInput}
                      placeholder="e.g. 1234 or your PIN"
                      placeholderTextColor={theme.colors.outline}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <MaterialIcons
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={theme.colors.outline}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Complete Setup & Launch Tracker</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= LOGIN FORM ================= */
            <View style={styles.loginCard}>
              <View style={styles.loginAvatarWrap}>
                <MaterialIcons name="lock-outline" size={32} color={theme.colors.primary} />
              </View>

              <Text style={styles.loginCardTitle}>Enter Your Passcode</Text>
              <Text style={styles.loginCardSubtitle}>
                Protected local session stored on device
              </Text>

              <View style={[styles.inputField, { width: '100%', marginTop: 12 }]}>
                <MaterialIcons name="vpn-key" size={20} color={theme.colors.outline} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={styles.textInput}
                  placeholder="Enter your passcode"
                  placeholderTextColor={theme.colors.outline}
                  secureTextEntry={!showPassword}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={theme.colors.outline}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { width: '100%', marginTop: 20 }, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="lock-open" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Unlock Tracker</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#131B2E',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#737686',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(213, 32, 34, 0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#D52022',
    fontWeight: '600',
  },
  sectionWrap: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#131B2E',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
  },
  avatarPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#004AC6',
  },
  avatarPickerRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  avatarThumbWrap: {
    position: 'relative',
    marginRight: 8,
    borderRadius: 18,
    padding: 2,
  },
  avatarThumbSelected: {
    borderColor: '#004AC6',
    borderWidth: 2,
  },
  avatarThumb: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarCheckmark: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#004AC6',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#131B2E',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  smallPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smallPillActive: {
    backgroundColor: '#004AC6',
    borderColor: '#004AC6',
  },
  smallPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  smallPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  targetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF6FF',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  targetBannerText: {
    fontSize: 12,
    color: '#1E293B',
  },
  submitButton: {
    height: 48,
    backgroundColor: '#004AC6',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#004AC6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#131B2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    marginTop: 20,
  },
  loginAvatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#131B2E',
  },
  loginCardSubtitle: {
    fontSize: 12.5,
    color: '#737686',
    marginTop: 4,
    textAlign: 'center',
  },
});
