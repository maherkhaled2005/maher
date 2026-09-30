import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Send,
  User,
  ChevronRight,
  Shield,
  Wrench,
  Code,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import useSocket from '../../hooks/useSocket';

export default function TicketDetailsScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const ticketParam = route?.params?.ticket || {};
  const isStaff = ['owner', 'manager', 'customer_support', 'programmer'].includes(user?.role || '');

  const [ticket, setTicket] = useState<any>(ticketParam);
  const [messages, setMessages] = useState<any[]>(
    ticketParam.messages && Array.isArray(ticketParam.messages) && ticketParam.messages.length > 0
      ? ticketParam.messages
      : (ticketParam.description
        ? [
            {
              id: 'init_msg',
              senderType: 'customer',
              senderId: ticketParam.customerId || ticketParam.userId,
              senderName: ticketParam.customerName || ticketParam.client || 'العميل',
              message: ticketParam.description,
              createdAt: ticketParam.createdAt || new Date().toISOString(),
            },
          ]
        : [])
  );
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  // Real-time Socket.io integration
  const { socket } = useSocket(user?.id || null);

  const loadTicketDetails = async (isManualRefresh = false) => {
    const ticketId = ticket?.id || ticketParam?.id;
    if (!ticketId) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      const data = await fetchApi(`/support/tickets/${ticketId}`);
      if (data?.id) {
        setTicket((prev: any) => ({ ...prev, ...data }));
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (err: any) {
      console.warn('Error loading ticket details:', err.message);
    } finally {
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTicketDetails();
  }, [ticketParam?.id]);

  // Listen to instant real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;
    const ticketId = ticket?.id || ticketParam?.id;
    if (!ticketId) return;

    const handleTicketMessage = (payload: any) => {
      if (String(payload?.ticketId) === String(ticketId) && payload?.message) {
        setMessages((prev) => {
          const exists = prev.some((m) => String(m.id) === String(payload.message.id));
          if (exists) return prev;
          return [...prev, payload.message];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
      }
    };

    const handleTicketUpdate = (updatedTicket: any) => {
      if (String(updatedTicket?.id || updatedTicket?.ticketId) === String(ticketId)) {
        setTicket((prev: any) => ({ ...prev, ...updatedTicket }));
        if (Array.isArray(updatedTicket.messages) && updatedTicket.messages.length > 0) {
          setMessages(updatedTicket.messages);
        }
      }
    };

    socket.on('ticket_message', handleTicketMessage);
    socket.on('ticket_update', handleTicketUpdate);

    return () => {
      socket.off('ticket_message', handleTicketMessage);
      socket.off('ticket_update', handleTicketUpdate);
    };
  }, [socket, ticket?.id, ticketParam?.id]);

  const handleSendReply = async () => {
    if (!inputText.trim() || sending) return;
    const ticketId = ticket?.id || ticketParam?.id;
    if (!ticketId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await fetchApi(`/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        data: { message: textToSend, text: textToSend },
      });

      if (res?.messages && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
      if (res?.id) {
        setTicket((prev: any) => ({ ...prev, ...res }));
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل إرسال الرد، يرجى المحاولة لاحقاً');
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleTicketAction = async (action: 'transfer_tech' | 'transfer_programmer' | 'close') => {
    const ticketId = ticket?.id || ticketParam?.id;
    if (!ticketId) return;
    try {
      const res = await fetchApi(`/support/tickets/${ticketId}/actions`, {
        method: 'POST',
        data: { action },
      });
      const successTitle =
        action === 'transfer_programmer' ? '✅ تم التصعيد للمبرمجين' :
        action === 'transfer_tech' ? '✅ تم التوجيه لفريق الفنيين' : '✅ تم إغلاق التذكرة';
      const successMsg =
        action === 'transfer_programmer'
          ? 'تم تصعيد العطل وإرسال إشعار فوري للمسؤول التقني وفريق البرمجة مع توثيقه في مركز الأخطاء 💻'
          : action === 'transfer_tech'
          ? 'تم توجيه الاستفسار لغرفة الفنيين لمتابعة مواصفات الجهاز والإصلاح 🔧'
          : res?.message || 'تم تحديث التذكرة بنجاح';
      Alert.alert(successTitle, successMsg);
      await loadTicketDetails();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تنفيذ الإجراء');
    }
  };

  // Status badge styling and text
  const statusConfig = (() => {
    const st = ticket?.status || 'open';
    if (st === 'closed') return { label: 'مغلقة ✓', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' };
    if (st === 'in_progress') return { label: 'قيد المتابعة ⏳', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' };
    if (st === 'escalated') return { label: 'مُصعدة للمبرمجين 💻', bg: 'rgba(124, 58, 237, 0.15)', color: '#A78BFA' };
    return { label: 'مفتوحة ⚡', bg: 'rgba(212, 175, 55, 0.15)', color: colors.primary };
  })();

  const isTicketCreator = String(ticket?.customerId || ticket?.userId) === String(user?.id);
  const customerName = ticket?.customer?.name || ticket?.customerName || ticket?.client || 'العميل';
  const customerPhone = ticket?.customer?.phone || ticket?.customerPhone || ticket?.phone;
  const customerEmail = ticket?.customer?.email || ticket?.email || ticket?.userEmail;
  const supportAgentName = ticket?.supportAgentName || ticket?.supportAgent?.name || (isStaff ? 'أنت وفريق الدعم' : 'فريق الدعم الفني 🎧');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark }} edges={['top', 'bottom']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: '#141414',
          borderBottomWidth: 1,
          borderColor: '#222',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else if (navigation?.navigate) {
              navigation.navigate('Tickets');
            }
          }}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: '#1E1E1E',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#333',
          }}
        >
          <ChevronRight color={colors.white} size={22} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', flex: 1, marginHorizontal: 8 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: colors.primary, fontSize: typography.sizes.md, fontWeight: '900' }}>
              #{ticket?.id || 'تذكرة دعم'}
            </Text>
            <View style={{ backgroundColor: statusConfig.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ color: statusConfig.color, fontSize: 11, fontWeight: '700' }}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <Text numberOfLines={1} style={{ color: colors.gray, fontSize: typography.sizes.xs, marginTop: 2 }}>
            {ticket?.subject || ticket?.title || 'محادثة الدعم الفني'}
          </Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* Ticket Routing Meta Banner: Customer & Support Agent */}
      <View
        style={{
          backgroundColor: '#18181B',
          paddingHorizontal: spacing.md,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderColor: '#27272A',
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ alignItems: 'flex-end', flex: 1 }}>
          <Text style={{ color: colors.white, fontSize: 12, fontWeight: '800' }}>
            العميل: {customerName}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 1 }}>
            المسؤول: {supportAgentName}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-start' }}>
          {customerPhone ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${customerPhone}`)}
              style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}
            >
              <Phone size={12} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>
                {customerPhone}
              </Text>
            </TouchableOpacity>
          ) : null}
          {ticket?.createdAt ? (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <Clock size={10} color={colors.gray} />
              <Text style={{ color: colors.gray, fontSize: 10 }}>
                {new Date(ticket.createdAt).toLocaleDateString('ar-EG')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Staff Action Toolbar */}
      {isStaff && (
        <View
          style={{
            flexDirection: 'row-reverse',
            backgroundColor: '#111111',
            paddingHorizontal: spacing.md,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderColor: '#222',
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => handleTicketAction('transfer_tech')}
            style={{
              flex: 1,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(234, 88, 12, 0.15)',
              borderWidth: 1,
              borderColor: '#EA580C',
              paddingVertical: 6,
              borderRadius: borderRadius.md,
              gap: 4,
            }}
          >
            <Wrench size={13} color="#EA580C" />
            <Text style={{ color: '#EA580C', fontSize: 11, fontWeight: 'bold' }}>تحويل لفني 🔧</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTicketAction('transfer_programmer')}
            style={{
              flex: 1,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              borderWidth: 1,
              borderColor: '#7C3AED',
              paddingVertical: 6,
              borderRadius: borderRadius.md,
              gap: 4,
            }}
          >
            <Code size={13} color="#7C3AED" />
            <Text style={{ color: '#7C3AED', fontSize: 11, fontWeight: 'bold' }}>تصعيد لمبرمج 💻</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTicketAction('close')}
            style={{
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderWidth: 1,
              borderColor: '#10B981',
              borderRadius: borderRadius.md,
            }}
          >
            <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold' }}>إغلاق ✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages Thread */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => String(item.id || `msg_${index}`)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTicketDetails(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 24 }}
        renderItem={({ item }) => {
          const isStaffMsg = item.senderType === 'staff' || item.senderType === 'support' || item.isFromSupport === 1 || item.sender === 'agent';
          const msgText = item.message || item.text || '';

          // Anti-Self-Reply & Identity Resolution:
          // A user must NEVER reply to themselves or see the other party labeled as "أنت".
          let sentByMe = false;
          if (item.senderId && user?.id) {
            sentByMe = String(item.senderId) === String(user?.id);
          } else if (isTicketCreator) {
            // Ticket creator sees customer messages as mine, staff messages as support
            sentByMe = !isStaffMsg;
          } else if (isStaff) {
            // Staff sees staff messages as mine, customer messages as client
            sentByMe = isStaffMsg;
          }

          const senderLabel = sentByMe
            ? 'أنت'
            : (isStaffMsg
                ? (item.senderName || supportAgentName)
                : (item.senderName || customerName));

          const timeLabel = item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
            : (item.time || '');

          return (
            <View
              style={{
                alignSelf: sentByMe ? 'flex-end' : 'flex-start',
                backgroundColor: sentByMe ? colors.primary : '#1E1E1E',
                maxWidth: '85%',
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.sm,
                borderBottomRightRadius: sentByMe ? 2 : borderRadius.lg,
                borderBottomLeftRadius: !sentByMe ? 2 : borderRadius.lg,
                borderWidth: 1,
                borderColor: sentByMe ? colors.primary : '#333',
              }}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {isStaffMsg ? (
                  <Shield color={sentByMe ? colors.dark : colors.primary} size={14} />
                ) : (
                  <User color={sentByMe ? colors.dark : colors.white} size={14} />
                )}
                <Text
                  style={{
                    color: sentByMe ? colors.dark : colors.white,
                    fontSize: typography.sizes.xs,
                    fontWeight: '900',
                  }}
                >
                  {senderLabel}
                </Text>
              </View>
              <Text
                style={{
                  color: sentByMe ? colors.dark : colors.white,
                  fontSize: typography.sizes.sm,
                  textAlign: 'right',
                  lineHeight: 20,
                  fontWeight: sentByMe ? '700' : '400',
                }}
              >
                {msgText}
              </Text>
              {timeLabel ? (
                <View style={{ flexDirection: 'row', justifyContent: sentByMe ? 'flex-start' : 'flex-end', marginTop: 4 }}>
                  <Text style={{ color: sentByMe ? 'rgba(0,0,0,0.6)' : colors.gray, fontSize: 10 }}>
                    {timeLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Quick Replies for Staff */}
      {isStaff && (
        <View style={{ backgroundColor: '#111', paddingVertical: 6, borderTopWidth: 1, borderColor: '#222' }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: spacing.sm, gap: 6, flexDirection: 'row-reverse' }}
            data={[
              'أهلاً بك! تم استلام طلبك وجاري إسناد فني معتمد لمنطقتك حالاً ⚡',
              'تم تحويل تذكرتك للدعم الفني وسنتواصل معك هاتفياً للمتابعة 🎧',
              'تم تأكيد فحص الجهاز وإغلاق البلاغ بنجاح، شكراً لثقتكم ✅',
              'يرجى تزويدنا برقم الهاتف البديل لتسهيل وصول الفني 📍',
            ]}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setInputText(item)}
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.12)',
                  borderWidth: 1,
                  borderColor: colors.primary,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: borderRadius.full,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input Bar with Responsive Keyboard Fix */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: Math.max(10, insets.bottom || 10),
            backgroundColor: '#121212',
            borderTopWidth: 1,
            borderColor: '#222',
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={handleSendReply}
            disabled={!inputText.trim() || sending}
            style={{
              backgroundColor: inputText.trim() ? colors.primary : '#222',
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Send color={inputText.trim() ? colors.dark : colors.gray} size={18} />
            )}
          </TouchableOpacity>

          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#1C1C1C',
              color: colors.white,
              borderRadius: 21,
              paddingHorizontal: spacing.md,
              paddingVertical: Platform.OS === 'ios' ? 10 : 8,
              textAlign: 'right',
              borderWidth: 1,
              borderColor: '#333',
              fontSize: compact ? 13 : 14,
              maxHeight: 90,
            }}
            placeholder="اكتب ردك هنا..."
            placeholderTextColor={colors.gray}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
