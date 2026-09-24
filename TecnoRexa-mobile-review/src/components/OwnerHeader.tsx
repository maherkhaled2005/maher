import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PanResponder } from 'react-native';
import {
  Menu,
  ChevronRight,
  Crown,
  RefreshCw,
  Briefcase,
  Code2,
  Headphones,
  Wrench,
  Store,
  User,
  Bell,
  MessageCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../store/authStore';
import { normalizeRole } from '../utils/permissions';
import { fetchApi } from '../api/client';
import OwnerSideDrawer from './OwnerSideDrawer';

interface OwnerHeaderProps {
  title: string;
  subtitle?: string;
  sectionNumber?: number;
  navigation: any;
  currentScreen?: string;
  showBack?: boolean;
  onRefresh?: () => void;
  rightAction?: React.ReactNode;
  role?: string;
}

const ROLE_HEADER_META: Record<string, { color: string; icon: any; label: string }> = {
  owner: { color: colors.owner, icon: Crown, label: 'المالك' },
  manager: { color: colors.manager, icon: Briefcase, label: 'المدير' },
  programmer: { color: colors.programmer, icon: Code2, label: 'المبرمج' },
  lead_developer: { color: colors.programmer, icon: Code2, label: 'المطور' },
  customer_support: { color: colors.support, icon: Headphones, label: 'الدعم' },
  support: { color: colors.support, icon: Headphones, label: 'الدعم' },
  technician: { color: colors.technician, icon: Wrench, label: 'الفني' },
  merchant: { color: colors.merchant, icon: Store, label: 'التاجر' },
  customer: { color: colors.customer, icon: User, label: 'العميل' },
};

export default function OwnerHeader({
  title,
  subtitle,
  sectionNumber,
  navigation,
  currentScreen = 'Home',
  showBack = false,
  onRefresh,
  rightAction,
  role: propRole,
}: OwnerHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const { user } = useAuthStore();
  const effectiveRole = propRole || user?.role || 'owner';
  const normRole = normalizeRole(effectiveRole);
  const meta = ROLE_HEADER_META[normRole] || ROLE_HEADER_META.owner;
  const RoleIcon = meta.icon;
  const activeColor = meta.color;

  // Swipe Left-to-Right gesture listener to open side drawer
  const edgePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dx > 30 && Math.abs(gestureState.dy) < 40 && evt.nativeEvent.pageX < 90;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 35) {
          setDrawerOpen(true);
        }
      },
    })
  ).current;

  useEffect(() => {
    let isMounted = true;
    const loadBadges = async () => {
      try {
        const res = await fetchApi('/header/badges');
        if (isMounted && res) {
          if (typeof res.unreadNotifications === 'number') setUnreadNotifications(res.unreadNotifications);
          if (typeof res.unreadMessages === 'number') setUnreadMessages(res.unreadMessages);
        }
      } catch {
        // graceful fallback
      }
    };
    loadBadges();
    const interval = setInterval(loadBadges, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <View style={[styles.container, { borderBottomColor: activeColor + '33' }]}>
        {/* Right side (RTL Start): ☰ Hamburger Button & Role Badge */}
        <View style={styles.sideGroup}>
          <TouchableOpacity
            style={[styles.hamburgerBtn, { borderColor: activeColor + '55' }]}
            onPress={() => setDrawerOpen(true)}
            activeOpacity={0.8}
            accessibilityLabel="فتح القايمه الرئيسية ☰"
          >
            <Menu size={22} color={activeColor} />
            <View style={[styles.crownBadge, { backgroundColor: activeColor }]}>
              <RoleIcon size={10} color="#0A0A0A" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Center: Title and Subtitle / Section Number */}
        <View style={styles.centerGroup}>
          <View style={styles.titleRow}>
            {sectionNumber ? (
              <View style={[styles.numBadge, { borderColor: activeColor, backgroundColor: activeColor + '22' }]}>
                <Text style={[styles.numText, { color: activeColor }]}>#{sectionNumber}</Text>
              </View>
            ) : null}
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
          </View>
          {subtitle ? (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Left side: Back Button, Refresh, Badges, or Custom Right Action */}
        <View style={[styles.sideGroup, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
          {/* Notifications Button */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation?.navigate && navigation.navigate('Notifications')}
            activeOpacity={0.8}
            accessibilityLabel="الإشعارات"
          >
            <Bell size={18} color={colors.gray} />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Chat Button */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation?.navigate && navigation.navigate('ChatList')}
            activeOpacity={0.8}
            accessibilityLabel="المحادثات"
          >
            <MessageCircle size={18} color={colors.gray} />
            {unreadMessages > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: '#0A0A0A' }]}>
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {onRefresh && (
            <TouchableOpacity style={styles.iconBtn} onPress={onRefresh} activeOpacity={0.8} accessibilityLabel="تحديث">
              <RefreshCw size={18} color={colors.gray} />
            </TouchableOpacity>
          )}
          {rightAction}
          {showBack ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                if (navigation?.canGoBack && navigation.canGoBack()) {
                  navigation.goBack();
                } else if (navigation?.navigate) {
                  navigation.navigate('Home');
                }
              }}
              activeOpacity={0.8}
              accessibilityLabel="العوده للخلف"
            >
              <ChevronRight size={22} color={colors.white} />
            </TouchableOpacity>
          ) : !rightAction && !onRefresh ? null : null}
        </View>
      </View>

      {/* Embedded Role-Aware Side Drawer */}
      <OwnerSideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        currentScreen={currentScreen}
        role={effectiveRole}
      />

      {/* Invisible Gesture Strip on Left Edge to catch Swipe LTR */}
      <View
        {...edgePanResponder.panHandlers}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: -1000,
          width: 35,
          zIndex: 9999,
          backgroundColor: 'transparent',
        }}
        pointerEvents="box-none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 32 : 12,
    paddingBottom: spacing.sm + 2,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    zIndex: 10,
    ...(Platform.OS === 'web' ? ({ position: 'sticky', top: 0 } as any) : {}),
  },
  sideGroup: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  numBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  numText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  titleText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  subtitleText: {
    color: colors.gray,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  hamburgerBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crownBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0A0A0A',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
