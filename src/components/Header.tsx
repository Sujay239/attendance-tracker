import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { theme } from '../theme/theme';
import { Logo } from './Logo';

interface HeaderProps {
  currentTab: string;
  isClockedIn: boolean;
  userAvatar: string;
  onProfilePress?: () => void;
  onClockStatusPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  isClockedIn,
  userAvatar,
  onProfilePress,
  onClockStatusPress,
}) => {
  const getSubTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'history':
        return 'History';
      case 'calendar':
        return 'Calendar';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'Tracker';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Logo size={36} />
        <View style={styles.titleColumn}>
          <Text style={styles.appTitle}>TimeTrack</Text>
          <Text style={styles.subTitle}>{getSubTitle()}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onClockStatusPress}
          style={[
            styles.statusPill,
            isClockedIn ? styles.statusPillActive : styles.statusPillInactive,
          ]}
        >
          <View
            style={[
              styles.pulseDot,
              isClockedIn ? styles.pulseDotActive : styles.pulseDotInactive,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              isClockedIn ? styles.statusTextActive : styles.statusTextInactive,
            ]}
          >
            {isClockedIn ? 'Clocked In' : 'Clocked Out'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onProfilePress}
          style={styles.avatarButton}
        >
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(19, 27, 46, 0.08)',
    zIndex: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        backdropFilter: 'blur(16px)',
      },
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 2,
  },
  titleColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.onSurface,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    gap: 6,
  },
  statusPillActive: {
    backgroundColor: '#85F8C440',
  },
  statusPillInactive: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.full,
  },
  pulseDotActive: {
    backgroundColor: theme.colors.secondary,
  },
  pulseDotInactive: {
    backgroundColor: theme.colors.outline,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: theme.colors.onSecondaryContainer,
  },
  statusTextInactive: {
    color: theme.colors.onSurfaceVariant,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    padding: 2,
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceContainerHighest,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.full,
  },
});
