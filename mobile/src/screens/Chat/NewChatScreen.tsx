import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Search, MessageSquare, ChevronLeft, UserCheck } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';
import { api } from '../../api/client';

interface Props {
  navigation: any;
}

interface UserContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
  avatar?: string;
  status?: string;
}

const ROLE_INFO: Record<string, { label: string; color: string; emoji: string }> = {
  owner: { label: 'المالك', color: colors.owner, emoji: '👑' },
  manager: { label: 'مدير النظام', color: colors.manager, emoji: '👔' },
  programmer: { label: 'مبرمج', color: colors.programmer, emoji: '💻' },
  support: { label: 'دعم فني', color: colors.support, emoji: '🎧' },
  customer_support: { label: 'خدمة عملاء', color: colors.support, emoji: '🎧' },
  technician: { label: 'فني معتمد', color: colors.technician, emoji: '🔧' },
  maintenance_tech: { label: 'فني صيانة', color: colors.technician, emoji: '🔧' },
  merchant: { label: 'تاجر معتمد', color: colors.merchant, emoji: '🏪' },
  customer: { label: 'عميل', color: colors.customer, emoji: '👤' },
  client: { label: 'عميل', color: colors.customer, emoji: '👤' },
};

export default function NewChatScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [contacts, setContacts] = useState<UserContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  const fetchContacts = useCallback(async (searchQuery: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/users/find?query=${encodeURIComponent(searchQuery || '')}`);
      if (Array.isArray(res.data)) {
        setContacts(res.data);
      }
    } catch (err: any) {
      console.warn('Error fetching contacts:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchContacts(query);
    }, 250);
    return () => clearTimeout(delay);
  }, [query, fetchContacts]);

  const handleStartChat = async (user: UserContact) => {
    try {
      setStartingChatId(user.id);
      const res = await api.post('/conversations', {
        name: user.name || 'محادثة',
        avatar: user.avatar || '👤',
        type: 'direct',
        participants: [user.id],
      });

      const conversation = res.data;
      navigation.navigate('ChatScreen', {
        chatId: conversation.id,
        userName: user.name,
        recipientId: user.id,
        isOnline: true,
      });
    } catch (err: any) {
      if (err.response?.status === 403) {
        Alert.alert(
          'غير مسموح ⚠️',
          err.response?.data?.error || 'لا يمكن بدء محادثة مباشرة مع هذا المستخدم. يرجى مراسلة خدمة العملاء والدعم الفني 🎧'
        );
        return;
      }
      console.warn('Error starting chat:', err.message);
      navigation.navigate('ChatScreen', {
        chatId: `conv_${user.id}`,
        userName: user.name,
        recipientId: user.id,
        isOnline: true,
      });
    } finally {
      setStartingChatId(null);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (selectedRoleFilter === 'all') return true;
    if (selectedRoleFilter === 'support') return c.role === 'support' || c.role === 'customer_support';
    if (selectedRoleFilter === 'technician') return c.role === 'technician' || c.role === 'maintenance_tech';
    if (selectedRoleFilter === 'merchant') return c.role === 'merchant';
    if (selectedRoleFilter === 'customer') return c.role === 'customer' || c.role === 'client';
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      {/* Header */}
      <OwnerHeader
        title="محادثة جديدة"
        subtitle="تواصل مع فريق العمل والعملاء والفنيين"
        navigation={navigation}
        showBack
        onRefresh={() => fetchContacts(query)}
      />

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث بالاسم أو رقم الهاتف أو التخصص..."
          placeholderTextColor={colors.gray}
          value={query}
          onChangeText={setQuery}
          textAlign="right"
        />
        <Search size={18} color={colors.primary} style={styles.searchIcon} />
      </View>

      {/* Role Filter Chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'technician', label: 'الفنيين 🔧' },
            { id: 'support', label: 'الدعم الفني 🎧' },
            { id: 'merchant', label: 'التجار 🏪' },
            { id: 'customer', label: 'العملاء 👤' },
          ].map((item) => {
            const isSelected = selectedRoleFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedRoleFilter(item.id)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Contacts List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>
          المستخدمون المتاحون ({filteredContacts.length})
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>جاري البحث في دليل المستخدمين...</Text>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>لم يتم العثور على مستخدمين متطابقين</Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
              تأكد من كتابة الاسم أو رقم الهاتف بشكل صحيح
            </Text>
          </View>
        ) : (
          filteredContacts.map((item) => {
            const roleMeta = ROLE_INFO[item.role] || {
              label: item.role || 'عضو',
              color: colors.primary,
              emoji: '👤',
            };
            const isStarting = startingChatId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.contactCard}
                onPress={() => handleStartChat(item)}
                disabled={isStarting}
                activeOpacity={0.75}
              >
                {/* Left Action Icon */}
                <View style={styles.actionIconWrapper}>
                  {isStarting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MessageSquare size={18} color={colors.primary} />
                  )}
                </View>

                {/* Info */}
                <View style={styles.contactInfo}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    {item.status === 'active' && <UserCheck size={14} color={colors.success} />}
                  </View>

                  <View style={styles.contactMeta}>
                    <View style={[styles.roleBadge, { backgroundColor: roleMeta.color + '22' }]}>
                      <Text style={[styles.roleText, { color: roleMeta.color }]}>
                        {roleMeta.emoji} {roleMeta.label}
                      </Text>
                    </View>
                    {item.phone ? (
                      <Text style={styles.phoneText}>{item.phone}</Text>
                    ) : (
                      <Text style={styles.lastSeen}>متاح للمحادثة</Text>
                    )}
                  </View>
                </View>

                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatar, { backgroundColor: roleMeta.color + '25', borderColor: roleMeta.color }]}>
                    <Text style={styles.avatarEmoji}>{roleMeta.emoji}</Text>
                  </View>
                  <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    ...(Platform.OS === 'web' ? ({  } as any) : {}),
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: '#141414',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginLeft: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: colors.white,
    fontSize: 14,
  },
  filterRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row-reverse',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  filterChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 150,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.gray,
    textAlign: 'right',
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    gap: 12,
  },
  loadingText: {
    color: colors.gray,
    fontSize: 13,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#222222',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  onlineDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    bottom: 1,
    right: 1,
    borderWidth: 2,
    borderColor: '#121212',
  },
  contactInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'right',
  },
  contactMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  phoneText: {
    fontSize: 12,
    color: colors.gray,
  },
  lastSeen: {
    fontSize: 11,
    color: colors.gray,
  },
  actionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '700',
  },
});
