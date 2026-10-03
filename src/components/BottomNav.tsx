import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export type TabKey = 'dashboard' | 'history' | 'calendar' | 'analytics' | 'settings';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  bottomInset?: number;
}

interface NavItem {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'schedule' },
  { key: 'history', label: 'History', icon: 'receipt-long' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-month' },
  { key: 'analytics', label: 'Analytics', icon: 'trending-up' },
  { key: 'settings', label: 'Settings', icon: 'tune' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  bottomInset = 0,
}) => {
  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(bottomInset, 10) }]}>
      <View style={styles.container}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={() => onTabChange(item.key)}
              style={styles.tabButton}
            >
              <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                <MaterialIcons
                  name={item.icon}
                  size={22}
                  color={isActive ? theme.colors.primary : theme.colors.outline}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {item.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(250, 248, 255, 0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(19, 27, 46, 0.08)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#131B2E',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  iconContainer: {
    padding: 3,
    borderRadius: theme.radius.md,
  },
  iconContainerActive: {
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 2,
  },
});
