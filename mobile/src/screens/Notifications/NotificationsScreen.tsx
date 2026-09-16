import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  Bell,
  CheckCircle,
  Send,
  Trash2,
  Users,
  Clock,
  Search,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  desc: string;
  type: string;
  actionUrl: string;
  read: number;
  createdAt: string;
}

type TabType = 'all' | 'unread' | 'system' | 'broadcasts';

const NotificationsScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [broadcasts, setBroadcasts] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Broadcast Modal State
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [bcTitle, setBcTitle] = useState('');
  const [bcMessage, setBcMessage] = useState('');
  const [bcTargetRole, setBcTargetRole] = useState<'all' | 'customer' | 'technician' | 'merchant'>('all');
  const [bcType, setBcType] = useState<'promotional' | 'system' | 'security'>('system');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const fetchNotifications = async () => {
    try {
      if (isOwner) {
        const res = await api.get('/owner/notifications');
        if (res.data) {
          setNotifications(res.data.notifications || []);
          setBroadcasts(res.data.broadcasts || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } else {
        const res = await api.get('/notifications');
        const list = Array.isArray(res.data) ? res.data : (res.data?.notifications || []);
        setNotifications(list);
        setBroadcasts([]);
        setUnreadCount(list.filter((n: any) => !n.read).length);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isOwner]);

  const handleMarkAllRead = async () => {
    try {
      const endpoint = isOwner ? '/owner/notifications/read-all' : '/notifications/read-all';
      const res = await api.post(endpoint);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
        setUnreadCount(0);
        Alert.alert('نجاح', 'تم تحديد جميع الإشعارات كمقروءة');
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر تحديث الإشعارات');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const endpoint = isOwner ? `/owner/notifications/${id}/read` : `/notifications/${id}/read`;
      await api.post(endpoint);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: 1 } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const endpoint = isOwner ? `/owner/notifications/${id}` : `/notifications/${id}`;
      const res = await api.delete(endpoint);
      if (res.data?.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setBroadcasts(prev => prev.filter(n => n.id !== id));
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر حذف الإشعار');
    }
  };

  const handleSendBroadcast = async () => {
    if (!bcTitle.trim() || !bcMessage.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال عنوان ونص الإشعار');
      return;
    }

    setSendingBroadcast(true);
    try {
      const res = await api.post('/owner/notifications/broadcast', {
        title: bcTitle.trim(),
        message: bcMessage.trim(),
        targetRole: bcTargetRole,
        broadcastType: bcType,
      });

      if (res.data?.success) {
        const msg = `تم بث الإشعار بنجاح إلى: ${getTargetRoleLabel(bcTargetRole)}`;
        Alert.alert('نجاح الإرسال 🚀', msg);
        setBcTitle('');
        setBcMessage('');
        setBroadcastModalVisible(false);
        fetchNotifications();
      } else {
        Alert.alert('خطأ', res.data?.error || 'تعذر إرسال الإشعار');
      }
    } catch (e: any) {
      Alert.alert('خطأ', e.response?.data?.error || 'تعذر إرسال الإشعار، يرجى المحاولة مرة أخرى');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const getTargetRoleLabel = (role: string) => {
    switch (role) {
      case 'all': return 'جميع المستخدمين 👥';
      case 'customer': return 'العملاء فقط 👤';
      case 'technician': return 'الفنيين فقط 🔧';
      case 'merchant': return 'التجار فقط 🏬';
      default: return role;
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'order':
        return { icon: '📦', label: 'طلب جديد', color: colors.primary };
      case 'technician':
        return { icon: '🔧', label: 'فني معتمد', color: '#10B981' };
      case 'wallet':
        return { icon: '💰', label: 'معاملة مالية', color: '#F59E0B' };
      case 'security':
        return { icon: '🛡️', label: 'تنبيه أمني', color: '#EF4444' };
      case 'promotional':
        return { icon: '🎁', label: 'ترويجي وعروض', color: '#8B5CF6' };
      case 'welcome':
        return { icon: '🎉', label: 'ترحيب بالمستخدم', color: '#06B6D4' };
      default:
        return { icon: '⚙️', label: 'إشعار نظام', color: '#6366F1' };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread' && n.read !== 0) return false;
    if (activeTab === 'system' && n.type !== 'system' && n.type !== 'security') return false;
    if (activeTab === 'broadcasts' && n.userId !== 'broadcast') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        (n.desc && n.desc.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <OwnerHeader
        title="الإشعارات والتنبيهات"
        sectionNumber={isOwner ? 17 : undefined}
        navigation={navigation}
        showBack={true}
        currentScreen="Notifications"
        rightAction={
          isOwner ? (
            <TouchableOpacity
              style={styles.headerRightAction}
              onPress={() => setBroadcastModalVisible(true)}
            >
              <Send size={15} color={colors.dark} />
              <Text style={styles.headerRightActionText}>بث إشعار</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Quick Action Top Banner */}
      <View style={styles.quickBar}>
        <View style={styles.statsSummary}>
          <Bell size={18} color={colors.primary} />
          <Text style={styles.summaryText}>
            إجمالي الإشعارات: <Text style={styles.summaryBold}>{notifications.length}</Text>
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount} غير مقروء</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllRead}>
          <CheckCircle size={15} color={colors.primary} />
          <Text style={styles.readAllText}>قراءة الكل</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Search size={16} color={colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث في نص أو عنوان الإشعار..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'all' && styles.activeTabBtn]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'all' && styles.activeTabBtnText]}>
            الكل ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'unread' && styles.activeTabBtn]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'unread' && styles.activeTabBtnText]}>
            غير مقروء ({unreadCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'system' && styles.activeTabBtn]}
          onPress={() => setActiveTab('system')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'system' && styles.activeTabBtnText]}>
            النظام
          </Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'broadcasts' && styles.activeTabBtn]}
            onPress={() => setActiveTab('broadcasts')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'broadcasts' && styles.activeTabBtnText]}>
              سجل البث ({broadcasts.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>جاري تحميل سجل الإشعارات...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              tintColor={colors.primary}
            />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={48} color={colors.gray} style={{ opacity: 0.4 }} />
              <Text style={styles.emptyTitle}>لا توجد إشعارات حالياً</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'unread'
                  ? 'رائع! لا توجد لديك أي إشعارات غير مقروءة.'
                  : 'ستظهر هنا كل التنبيهات وإشعارات النظام أولاً بأول.'}
              </Text>
            </View>
          ) : (
            filteredNotifications.map(item => {
              const typeCfg = getTypeConfig(item.type);
              const isUnread = item.read === 0;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                  activeOpacity={0.8}
                  onPress={() => isUnread && handleMarkRead(item.id)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeIcon}>{typeCfg.icon}</Text>
                      <Text style={[styles.typeLabel, { color: typeCfg.color }]}>
                        {typeCfg.label}
                      </Text>
                    </View>

                    <View style={styles.headerRight}>
                      {isUnread && <View style={styles.unreadDot} />}
                      <View style={styles.timeTag}>
                        <Clock size={12} color={colors.gray} />
                        <Text style={styles.timeText}>
                          {new Date(item.createdAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.desc}</Text>

                  <View style={styles.cardFooter}>
                    {item.userId === 'broadcast' ? (
                      <View style={styles.targetBadge}>
                        <Users size={12} color={colors.primary} />
                        <Text style={styles.targetBadgeText}>
                          مرسل إلى: {getTargetRoleLabel(item.actionUrl || 'all')}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.dateTag}>
                        <Text style={styles.dateText}>
                          {new Date(item.createdAt).toLocaleDateString('ar-EG')}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardActions}>
                      {isUnread && (
                        <TouchableOpacity
                          style={styles.actionBtnRead}
                          onPress={() => handleMarkRead(item.id)}
                        >
                          <CheckCircle size={14} color={colors.primary} />
                          <Text style={styles.actionBtnReadText}>تحديد كمقروء</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => handleDeleteNotification(item.id)}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Broadcast Modal */}
      <Modal
        visible={broadcastModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBroadcastModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Send size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>إرسال إشعار عام فوري (Broadcast)</Text>
              </View>
              <TouchableOpacity onPress={() => setBroadcastModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {/* Audience Selection */}
              <Text style={styles.inputLabel}>الفئة المستهدفة من الإشعار:</Text>
              <View style={styles.chipsRow}>
                {[
                  { key: 'all', label: 'الجميع 👥' },
                  { key: 'customer', label: 'العملاء 👤' },
                  { key: 'technician', label: 'الفنيين 🔧' },
                  { key: 'merchant', label: 'التجار 🏬' },
                ].map(r => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.chip,
                      bcTargetRole === r.key && styles.activeChip,
                    ]}
                    onPress={() => setBcTargetRole(r.key as any)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        bcTargetRole === r.key && styles.activeChipText,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notification Type Selection */}
              <Text style={styles.inputLabel}>نوع التنبيه:</Text>
              <View style={styles.chipsRow}>
                {[
                  { key: 'system', label: '⚙️ تحديث نظام' },
                  { key: 'promotional', label: '🎁 عرض ترويجي' },
                  { key: 'security', label: '🛡️ تنبيه أمني' },
                ].map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.chip, bcType === t.key && styles.activeChip]}
                    onPress={() => setBcType(t.key as any)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        bcType === t.key && styles.activeChipText,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title Input */}
              <Text style={styles.inputLabel}>عنوان الإشعار:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="مثال: خصم 20% على جميع خدمات الصيانة..."
                placeholderTextColor={colors.gray}
                value={bcTitle}
                onChangeText={setBcTitle}
              />

              {/* Message Input */}
              <Text style={styles.inputLabel}>نص الرسالة:</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="اكتب تفاصيل التنبيه الموجه للمستخدمين..."
                placeholderTextColor={colors.gray}
                value={bcMessage}
                onChangeText={setBcMessage}
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setBroadcastModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmSendBtn}
                disabled={sendingBroadcast}
                onPress={handleSendBroadcast}
              >
                {sendingBroadcast ? (
                  <ActivityIndicator size="small" color={colors.dark} />
                ) : (
                  <>
                    <Send size={16} color={colors.dark} />
                    <Text style={styles.confirmSendBtnText}>إرسال البث الآن</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  headerRightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  headerRightActionText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  statsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    color: colors.white,
    fontSize: 13,
  },
  summaryBold: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  unreadPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unreadPillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  readAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    paddingVertical: 10,
    fontSize: 13,
    textAlign: 'right',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  activeTabBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: colors.primary,
  },
  tabBtnText: {
    color: colors.gray,
    fontSize: 12,
  },
  activeTabBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.gray,
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 12,
    paddingBottom: 150,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    color: colors.gray,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  notifCard: {
    backgroundColor: '#141414',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#222',
    gap: 8,
  },
  notifCardUnread: {
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: '#18150D',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#202020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  typeIcon: {
    fontSize: 12,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: colors.gray,
    fontSize: 11,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  cardDesc: {
    color: '#BBB',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  targetBadgeText: {
    color: colors.primary,
    fontSize: 11,
  },
  dateTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dateText: {
    color: colors.gray,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnRead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  actionBtnReadText: {
    color: colors.primary,
    fontSize: 11,
  },
  actionBtnDelete: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#181818',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: spacing.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeBtnText: {
    color: colors.gray,
    fontSize: 18,
    padding: 4,
  },
  inputLabel: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeChip: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.gray,
    fontSize: 12,
  },
  activeChipText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: '#101010',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#333',
    padding: 10,
    color: colors.white,
    fontSize: 13,
    textAlign: 'right',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: '#282828',
  },
  cancelBtnText: {
    color: colors.gray,
    fontSize: 13,
  },
  confirmSendBtn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  confirmSendBtnText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default NotificationsScreen;
