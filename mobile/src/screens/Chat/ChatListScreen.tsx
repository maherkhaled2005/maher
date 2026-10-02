import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, Modal, Alert, Platform, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import {
  Search,
  MessageCircle,
  Eye,
  AlertTriangle,
  Lock,
  Printer,
  X,
  Send,
  Shield,
  Clock,
  User,
  Plus,
  Headphones,
  Code,
  MessageSquare,
} from 'lucide-react-native';
import { fetchApi, api } from '../../api/client';
import { colors, spacing, borderRadius, MAX_CHAT_WIDTH } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';
import { useAuthStore } from '../../store/authStore';
import { maskConversationName, maskPhoneNumbers } from '../../utils/conversationPrivacy';
import { normalizeRole } from '../../utils/permissions';
import useSocket from '../../hooks/useSocket';

interface ConvItem {
  id: string;
  name: string;
  type: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  createdAt: string;
  isOnline?: boolean;
  unreadCount?: number;
}

export default function ChatListScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const isObserver = user?.role === 'owner' || user?.role === 'manager';
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Observer Mode Modal
  const [observerModalVisible, setObserverModalVisible] = useState(false);
  const [selectedConv, setSelectedConv] = useState<ConvItem | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const { socket } = useSocket(user?.id || null);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/conversations');
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (err: any) {
      console.warn('Error loading conversations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Reload when returning from a conversation so read status updates
  useEffect(() => {
    if (!navigation?.addListener) return;
    const unsubscribe = navigation.addListener('focus', () => {
      loadConversations();
    });
    return unsubscribe;
  }, [navigation]);

  // Real-time socket listener for incoming messages and conversation updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (!msg) return;
      setConversations((prev) => {
        const idx = prev.findIndex((c) => String(c.id) === String(msg.conversationId));
        if (idx !== -1) {
          const updated = [...prev];
          const conv = updated[idx];
          const isFromMe = String(msg.senderId) === String(user?.id);
          updated[idx] = {
            ...conv,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt || new Date().toISOString(),
            unreadCount: isFromMe ? (conv.unreadCount || 0) : ((conv.unreadCount || 0) + 1),
          };
          const [target] = updated.splice(idx, 1);
          return [target, ...updated];
        } else {
          loadConversations();
          return prev;
        }
      });
    };

    const handleConvUpdate = (update: any) => {
      if (!update) return;
      setConversations((prev) =>
        prev.map((c) =>
          String(c.id) === String(update.conversationId)
            ? { ...c, lastMessage: update.lastMessage, lastMessageTime: update.lastMessageTime }
            : c
        )
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_update', handleConvUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_update', handleConvUpdate);
    };
  }, [socket, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  const filteredConversations = conversations.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.lastMessage || '').toLowerCase().includes(search.toLowerCase())
  );

  // Open Observer Mode
  const openObserverMode = async (conv: ConvItem) => {
    setSelectedConv(conv);
    setObserverModalVisible(true);
    setLoadingMessages(true);
    try {
      const res = await fetchApi(`/messages/${conv.id}`);
      if (Array.isArray(res)) {
        setMessages(res);
      } else {
        setMessages([
          { id: '1', senderId: 'customer', content: conv.lastMessage || 'مرحباً، أود الاستفسار عن الخدمة', timestamp: conv.lastMessageTime || new Date().toISOString() },
        ]);
      }
    } catch (err) {
      setMessages([
        { id: '1', senderId: 'customer', content: conv.lastMessage || 'مرحباً، أود الاستفسار عن موعد الصيانة', timestamp: conv.lastMessageTime || new Date().toISOString() },
      ]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Action 1: Send Administrative Warning
  const handleSendWarning = async () => {
    if (!selectedConv) return;
    try {
      await fetchApi(`/owner/chat/${selectedConv.id}/warning`, { method: 'POST' });
      setMessages([
        ...messages,
        {
          id: `warn_${Date.now()}`,
          senderId: 'owner_admin',
          type: 'system_warning',
          content: '⚠️ تحذير رسمي من إدارة المنصة: يرجى الالتزام بسياسات الخدمة والتعامل باحترام وتجنب أي اتفاقات خارج التطبيق.',
          timestamp: new Date().toISOString(),
        },
      ]);
      Alert.alert('📢 تم إرسال التحذير', 'تم بث التحذير الإداري فوراً داخل المحادثة لأطراف المحادثة.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إرسال التحذير');
    }
  };

  // Action 2: Lock Conversation
  const handleLockChat = async () => {
    if (!selectedConv) return;
    try {
      await fetchApi(`/owner/chat/${selectedConv.id}/lock`, { method: 'POST' });
      setMessages([
        ...messages,
        {
          id: `lock_${Date.now()}`,
          senderId: 'owner_admin',
          type: 'system_locked',
          content: '⛔ تم إغلاق هذه المحادثة إدارياً من قبل المالك لمنع إرسال مزيد من الرسائل.',
          timestamp: new Date().toISOString(),
        },
      ]);
      Alert.alert('⛔ تم قفل المحادثة', 'تم تجميد المحادثة ومنع إرسال أي رسائل جديدة.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر قفل المحادثة');
    }
  };

  // Action 3: Export PDF
  const handleExportPDF = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      Alert.alert('تصدير المحادثة', 'تم تجهيز سجل المحادثة الكامل بصيغة PDF للتحقيق.');
    }
  };

  const handleOpenSupportChat = async () => {
    try {
      setLoading(true);
      const res = await api.post('/conversations', {
        name: 'خدمة العملاء والدعم الفني 🎧',
        avatar: '🎧',
        type: 'direct',
        participants: ['support_official'],
      });
      const conv = res.data;
      navigation.navigate('ChatScreen', {
        chatId: conv.id,
        userName: 'خدمة العملاء والدعم الفني 🎧',
        recipientId: 'support_official',
        isOnline: true,
      });
    } catch {
      navigation.navigate('ChatScreen', {
        chatId: 'support_official',
        userName: 'خدمة العملاء والدعم الفني 🎧',
        recipientId: 'support_official',
        isOnline: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleHeader = () => {
    const role = normalizeRole(user?.role || '');
    switch (role) {
      case 'owner':
      case 'manager':
        return {
          title: 'محادثات المنصة والرقابة',
          subtitle: `سجل الرقابة والمحادثات (${conversations.length} محادثة)`,
        };
      case 'customer':
        return {
          title: 'المحادثات والرسائل 💬',
          subtitle: 'تواصل مع الفنيين وخدمة العملاء',
        };
      case 'technician':
        return {
          title: 'محادثات الصيانة 💬',
          subtitle: 'تواصل مع أصحاب الأجهزة والموردين',
        };
      case 'merchant':
        return {
          title: 'محادثات المتجر 💬',
          subtitle: 'تواصل مع الفنيين والمشترين والدعم',
        };
      case 'customer_support':
      case 'support':
        return {
          title: 'مركز المحادثات المباشرة 🎧',
          subtitle: 'خدمة العملاء والدعم الفني',
        };
      case 'programmer':
        return {
          title: 'شات المطورين وفريق العمل 💻',
          subtitle: 'غرفة النقاش التقني المباشر',
        };
      default:
        return {
          title: 'المحادثات 💬',
          subtitle: 'المحادثات الفورية',
        };
    }
  };

  const headerInfo = getRoleHeader();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.dark }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* ☰ Owner Header with Drawer navigation */}
      <OwnerHeader
        title={headerInfo.title}
        subtitle={headerInfo.subtitle}
        sectionNumber={9}
        navigation={navigation}
        currentScreen="ChatList"
        showBack
        onRefresh={loadConversations}
      />

      {/* Top Search Bar & New Chat Button */}
      <View style={{ width: '100%', maxWidth: MAX_CHAT_WIDTH, alignSelf: 'center', backgroundColor: '#111111', padding: spacing.md, borderBottomWidth: 1, borderColor: '#222' }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewChat')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.md,
              gap: 6,
            }}
          >
            <Plus size={18} color="#0A0A0A" />
            <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: compact ? 12 : 13 }}>محادثة جديدة</Text>
          </TouchableOpacity>

          <View
            style={{
              flex: 1,
              minWidth: 0,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#1A1A1A',
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.sm,
              borderWidth: 1,
              borderColor: '#333',
            }}
          >
            <Search size={16} color={colors.primary} />
            <TextInput
              style={{ flex: 1, minWidth: 0, paddingVertical: 8, paddingHorizontal: 6, textAlign: 'right', color: colors.white, fontSize: 13 }}
              placeholder="ابحث في أطراف المحادثات..."
              placeholderTextColor={colors.gray}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={16} color={colors.gray} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: spacing.sm }}>جاري تحميل المحادثات...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212, 175, 55, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
            <MessageCircle size={44} color={colors.primary} />
          </View>
          <Text style={{ color: colors.white, fontSize: 18, fontWeight: '900', marginTop: spacing.xs, textAlign: 'center' }}>
            {isObserver ? 'لا توجد محادثات مسجلة حالياً' : 'لا توجد محادثات نشطة'}
          </Text>
          <Text style={{ color: colors.gray, fontSize: 13, marginTop: 8, textAlign: 'center', maxWidth: 320, lineHeight: 20 }}>
            {isObserver
              ? 'المحادثات المتبادلة بين العملاء، الفنيين، والتجار تظهر هنا للرقابة الأمنية والإدارية.'
              : 'يمكنك بدء محادثة جديدة الآن للتواصل مع الفنيين أو خدمة العملاء والدعم الفني فوراً.'}
          </Text>

          <View style={{ width: '100%', maxWidth: 300, gap: 10, marginTop: 24 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('NewChat')}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: borderRadius.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Plus size={18} color="#0A0A0A" />
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 14 }}>بدء محادثة جديدة</Text>
            </TouchableOpacity>

            {user?.role !== 'customer_support' && user?.role !== 'support' && (
              <TouchableOpacity
                onPress={handleOpenSupportChat}
                style={{
                  backgroundColor: '#1E1E1E',
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 12,
                  borderRadius: borderRadius.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Headphones size={18} color={colors.primary} />
                <Text style={{ color: colors.white, fontWeight: '800', fontSize: 13 }}>تواصل فوري مع الدعم الفني 🎧</Text>
              </TouchableOpacity>
            )}

            {(user?.role === 'programmer' || user?.role === 'owner') && (
              <TouchableOpacity
                onPress={() => navigation.navigate('DevChat')}
                style={{
                  backgroundColor: '#7C3AED22',
                  borderWidth: 1,
                  borderColor: '#7C3AED',
                  paddingVertical: 12,
                  borderRadius: borderRadius.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Code size={18} color="#A855F7" />
                <Text style={{ color: '#A855F7', fontWeight: '800', fontSize: 13 }}>شات فريق التطوير 💻</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          style={{ width: '100%', alignSelf: 'center', maxWidth: MAX_CHAT_WIDTH }}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 40, flexGrow: 1 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (isObserver) {
                  Alert.alert(
                    'خيارات المحادثة 💬',
                    `محادثة: ${item.name}`,
                    [
                      {
                        text: 'دخول المحادثة والرد كإدارة 💬',
                        onPress: () => {
                          navigation.navigate('ChatScreen', {
                            chatId: item.id,
                            userName: item.name,
                            userRole: (item as any).otherUserRole,
                            isOnline: Boolean(item.isOnline),
                            isGroup: item.type === 'group',
                          });
                        },
                      },
                      {
                        text: 'وضع المراقب (تحذير / تجميد) 👁️',
                        onPress: () => openObserverMode(item),
                      },
                      { text: 'إلغاء', style: 'cancel' },
                    ]
                  );
                } else {
                  navigation.navigate('ChatScreen', {
                    chatId: item.id,
                    userName: item.name,
                    userRole: (item as any).otherUserRole,
                    isOnline: Boolean(item.isOnline),
                    isGroup: item.type === 'group',
                  });
                }
              }}
              style={{
                backgroundColor: '#141414',
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: '#222',
                padding: spacing.md,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#1E1E1E',
                    borderWidth: 1,
                    borderColor: '#333',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>💬</Text>
                  {Boolean(item.isOnline) && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#10B981',
                        borderWidth: 2,
                        borderColor: '#141414',
                      }}
                    />
                  )}
                </View>

                <View style={{ alignItems: 'flex-end', flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: colors.white, fontSize: compact ? 13 : 14, fontWeight: 'bold', maxWidth: '100%' }}>
                    {maskConversationName({
                      otherUserName: item.name,
                      otherUserRole: (item as any).otherUserRole,
                      viewerRole: user?.role,
                      isGroup: item.type === 'group' || (item as any).isGroup,
                    })}
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {maskPhoneNumbers(item.lastMessage) || 'بدء المحادثة'}
                  </Text>
                </View>
              </View>

              {/* Right side: Unread badge & Observer/Chat badge */}
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                {Boolean((item.unreadCount || 0) > 0) && (
                  <View
                    style={{
                      backgroundColor: '#EF4444',
                      borderRadius: 10,
                      minWidth: 20,
                      height: 20,
                      paddingHorizontal: 6,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>
                      {item.unreadCount! > 99 ? '+99' : item.unreadCount}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(212, 175, 55, 0.12)',
                    borderWidth: 1,
                    borderColor: colors.primary,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: borderRadius.md,
                    flexShrink: 0,
                  }}
                >
                  {isObserver ? (
                    <>
                      <Eye size={12} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>مراقب</Text>
                    </>
                  ) : (
                    <>
                      <MessageCircle size={12} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>محادثة</Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODAL: Secret Observer Mode Viewer */}
      <Modal visible={observerModalVisible} transparent animationType="slide" onRequestClose={() => setObserverModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.sm }}>
          <View style={{ width: '100%', maxWidth: 540, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary, maxHeight: '92%' }}>
            {selectedConv && (
              <>
                {/* Header with Secret Observer Badge */}
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                      <Eye size={16} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '900' }}>وضع المراقب السري (Observer)</Text>
                    </View>
                    <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold', marginTop: 2 }}>{selectedConv.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setObserverModalVisible(false)}>
                    <X size={22} color={colors.gray} />
                  </TouchableOpacity>
                </View>

                <Text style={{ color: '#888', fontSize: 11, textAlign: 'right', marginBottom: spacing.sm }}>
                  👀 أنت تقرأ المحادثة بصفة مراقب سري دون إشعار أي من الأطراف.
                </Text>

                {/* Owner Control Actions */}
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm }}>
                  {/* Send Warning */}
                  <TouchableOpacity
                    onPress={handleSendWarning}
                    style={{
                      flex: 1,
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      borderWidth: 1,
                      borderColor: '#F59E0B',
                      paddingVertical: 7,
                      borderRadius: borderRadius.sm,
                      gap: 4,
                    }}
                  >
                    <AlertTriangle size={13} color="#F59E0B" />
                    <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: 'bold' }}>إرسال تحذير 📢</Text>
                  </TouchableOpacity>

                  {/* Lock Chat */}
                  <TouchableOpacity
                    onPress={handleLockChat}
                    style={{
                      flex: 1,
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(220, 38, 38, 0.15)',
                      borderWidth: 1,
                      borderColor: '#DC2626',
                      paddingVertical: 7,
                      borderRadius: borderRadius.sm,
                      gap: 4,
                    }}
                  >
                    <Lock size={13} color="#DC2626" />
                    <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: 'bold' }}>قفل المحادثة ⛔</Text>
                  </TouchableOpacity>

                  {/* Export PDF */}
                  <TouchableOpacity
                    onPress={handleExportPDF}
                    style={{
                      flex: 1,
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#1E1E1E',
                      borderWidth: 1,
                      borderColor: '#3B82F6',
                      paddingVertical: 7,
                      borderRadius: borderRadius.sm,
                      gap: 4,
                    }}
                  >
                    <Printer size={13} color="#3B82F6" />
                    <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: 'bold' }}>تصدير PDF 📜</Text>
                  </TouchableOpacity>

                  {/* Direct Enter Chat */}
                  <TouchableOpacity
                    onPress={() => {
                      setObserverModalVisible(false);
                      navigation.navigate('ChatScreen', {
                        chatId: selectedConv.id,
                        userName: selectedConv.name,
                        isOnline: true,
                      });
                    }}
                    style={{
                      flex: 1,
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(212, 175, 55, 0.15)',
                      borderWidth: 1,
                      borderColor: colors.primary,
                      paddingVertical: 7,
                      borderRadius: borderRadius.sm,
                      gap: 4,
                    }}
                  >
                    <MessageCircle size={13} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>دخول الشات 💬</Text>
                  </TouchableOpacity>
                </View>

                {/* Messages Box */}
                <ScrollView
                  style={{ maxHeight: 320, backgroundColor: '#1A1A1A', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md }}
                  contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
                >
                  {loadingMessages ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    messages.map((m) => {
                      const isSystem = m.type === 'system_warning' || m.type === 'system_locked';
                      return (
                        <View
                          key={m.id}
                          style={{
                            marginBottom: spacing.sm,
                            alignItems: isSystem ? 'center' : 'flex-end',
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: isSystem
                                ? 'rgba(220, 38, 38, 0.2)'
                                : '#262626',
                              borderWidth: isSystem ? 1 : 0,
                              borderColor: '#DC2626',
                              padding: spacing.sm,
                              borderRadius: borderRadius.md,
                              maxWidth: '90%',
                            }}
                          >
                            <Text
                              style={{
                                color: isSystem ? '#DC2626' : colors.white,
                                fontSize: 13,
                                fontWeight: isSystem ? 'bold' : 'normal',
                                textAlign: 'right',
                              }}
                            >
                              {m.content}
                            </Text>
                            <Text style={{ color: '#666', fontSize: 9, marginTop: 4, textAlign: 'left' }}>
                              {new Date(m.timestamp || m.createdAt || Date.now()).toLocaleTimeString('ar-EG')}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                <TouchableOpacity onPress={() => setObserverModalVisible(false)} style={{ padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}>
                  <Text style={{ color: colors.white, fontWeight: 'bold' }}>إغلاق وضع المراقب</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
