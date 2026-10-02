import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Phone,
  Send,
  Lock,
  CheckCheck,
  User,
  RefreshCw,
} from 'lucide-react-native';
import {
  colors,
  spacing,
  borderRadius,
  MAX_CHAT_WIDTH,
  isPhone,
  isDesktop,
  inputBarPaddingBottom,
} from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import useSocket from '../../hooks/useSocket';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { maskConversationName, maskPhoneNumbers } from '../../utils/conversationPrivacy';

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  content: string;
  type?: string;
  read?: number;
  createdAt: string;
  isMe?: boolean;
}

export default function ChatScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const params = route?.params || {};
  const chatId = params.chatId ?? 'default';
  const phone = params.phone ?? '';
  const isGroupParam = params.isGroup;

  // Never render the caller's own name as the peer, and never expose a
  // privileged staff identity (owner / manager / lead programmer) to regular users.
  const rawParamName = (params.userName && params.userName !== user?.name) ? params.userName : '';
  const peerName = maskConversationName({
    otherUserName: rawParamName,
    otherUserRole: params.userRole,
    viewerRole: user?.role,
    isGroup: params.isGroup,
  });
  const userName = peerName;
  const [resolvedPeerName, setResolvedPeerName] = useState<string>('');
  const displayName = resolvedPeerName || userName || 'محادثة الدعم 💬';

  useEffect(() => {
    if (chatId && chatId !== 'default') {
      if (!rawParamName || rawParamName === 'محادثة' || rawParamName === user?.name) {
        api.get(`/conversations/${chatId}`).then((res) => {
          if (res.data?.name && res.data.name !== user?.name) {
            setResolvedPeerName(res.data.name);
          }
        }).catch(() => {});
      }
    }
  }, [chatId, rawParamName, user?.name]);


  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight(insets.bottom);
  const phoneLayout = isPhone(width);
  const desktopLayout = isDesktop(width);
  const compact = width < 360;
  const msgFont = compact ? 13 : phoneLayout ? 14 : 15;
  const msgLineHeight = compact ? 19 : phoneLayout ? 21 : 23;
  const bubbleMaxWidth = desktopLayout ? '70%' : phoneLayout ? '82%' : compact ? '88%' : '78%';

  const [onlineState, setOnlineState] = useState<boolean>(params.isOnline !== false);
  const { socket } = useSocket(user?.id || null);

  // Real-time instant message arrival via Socket.io
  useEffect(() => {
    if (!socket || !chatId || chatId === 'default') return;

    socket.emit('join_conversation', chatId);

    const handleNewMessage = (newMsg: any) => {
      if (!newMsg) return;
      if (String(newMsg.conversationId) === String(chatId)) {
        setMessages((prev) => {
          const exists = prev.some((m) => String(m.id) === String(newMsg.id));
          if (exists) return prev;
          const myId = user?.id;
          const formatted: MessageItem = {
            ...newMsg,
            isMe: String(newMsg.senderId) === String(myId),
          };
          return [...prev, formatted];
        });
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 60);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, chatId, user?.id]);

  useEffect(() => {
    if (!socket || !chatId) return;
    const handlePresence = (data: { userId: string; status: 'online' | 'offline' }) => {
      if (String(data.userId) === String(chatId)) {
        setOnlineState(data.status === 'online');
      }
    };
    const handleStatus = (data: { userId: string; status: string }) => {
      if (String(data.userId) === String(chatId)) {
        setOnlineState(data.status === 'online');
      }
    };
    socket.on('user_presence', handlePresence);
    socket.on('presence_status', handleStatus);
    socket.emit('check_presence', chatId);
    return () => {
      socket.off('user_presence', handlePresence);
      socket.off('presence_status', handleStatus);
    };
  }, [socket, chatId]);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const isGroupOrDevChat = Boolean(
    String(chatId || '').includes('dev') ||
    String(chatId || '').includes('group') ||
    String(chatId || '').includes('team') ||
    isGroupParam ||
    userName?.includes('فريق') ||
    userName?.includes('مطورين') ||
    userName?.includes('برمجة')
  );
  const hasDirectPhone = Boolean(phone && phone !== '01000000000' && phone !== '01000000001' && phone !== '01020000000' && phone !== '01064739664');
  const canCall = !isGroupOrDevChat && hasDirectPhone;

  const scrollViewRef = useRef<ScrollView>(null);

  const loadMessages = useCallback(async (silent = false) => {
    if (!chatId) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/messages/${chatId}`);
      if (Array.isArray(res.data)) {
        const myId = user?.id;
        setMessages((prev) => {
          const fetched: MessageItem[] = res.data.map((m: any) => ({
            ...m,
            isMe: String(m.senderId) === String(myId),
          }));
          const fetchedKeys = new Set(
            fetched.map((f) => `${f.senderId}|${f.content}|${f.createdAt}`)
          );
          const pending = prev.filter(
            (m) =>
              String(m.id).startsWith('temp_') && !fetchedKeys.has(`${m.senderId}|${m.content}|${m.createdAt}`)
          );
          return [...fetched, ...pending];
        });
      }
    } catch (err: any) {
      console.warn('Error fetching messages:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [chatId, user?.id]);


  useEffect(() => {
    if (keyboardHeight > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [keyboardHeight]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => {
      loadMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    const t = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
    return () => clearTimeout(t);
  }, [messages.length]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const now = new Date().toISOString();

    const optimisticMsg: MessageItem = {
      id: tempId,
      conversationId: chatId,
      senderId: user?.id || 'me',
      content: text,
      createdAt: now,
      isMe: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMessage('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 60);

    try {
      const res = await api.post('/messages', {
        conversationId: chatId,
        recipientId: params.recipientId,
        conversationName: displayName,
        content: text,
        type: 'text',
      });
      if (res.data && res.data.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...res.data, isMe: true } : m))
        );
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('تعذر الإرسال', 'لم يتم إرسال الرسالة. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
    } finally {
      setSending(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
    }
  };

  const handleCall = () => {
    const clean = phone && phone !== '01000000000' ? String(phone).trim() : '';
    if (!clean) {
      Alert.alert('تنبيه', 'رقم الهاتف غير متوفر');
      return;
    }
    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert('تنبيه', 'تعذر إجراء المكالمة');
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.dark }}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%', maxWidth: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: compact ? 6 : spacing.sm,
          minHeight: 52,
          backgroundColor: '#111111',
          borderBottomWidth: 1,
          borderColor: '#222222',
          width: '100%',
        }}
      >
        {/* Right side: Back button & Contact Info */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <TouchableOpacity
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else if (navigation?.navigate) {
                navigation.navigate('ChatList');
              }
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#1C1C1C',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#333333',
            }}
          >
            <ChevronRight color={colors.white} size={22} />
          </TouchableOpacity>

          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <User color={colors.primary} size={20} />
          </View>

          <View style={{ alignItems: 'flex-end', flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ color: colors.white, fontSize: compact ? 13 : 15, fontWeight: '800', maxWidth: '100%' }}
            >
              {displayName}
            </Text>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: onlineState ? colors.success : colors.gray,
                }}
              />
              <Text style={{ color: onlineState ? colors.success : colors.gray, fontSize: 10, fontWeight: '700' }}>
                {onlineState ? 'متصل الآن 🟢' : 'غير متصل ⚪'}
              </Text>
            </View>
          </View>
        </View>

        {/* Left side: Action icons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <TouchableOpacity
            onPress={() => loadMessages(false)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#181818',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw color={colors.primary} size={16} />
          </TouchableOpacity>

          {canCall && (
            <TouchableOpacity
              onPress={handleCall}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#181818',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Phone color={colors.white} size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages Scroll Area */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{
            width: '100%',
            maxWidth: MAX_CHAT_WIDTH,
            alignSelf: 'center',
            padding: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.lg,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Security Encryption Badge */}
          <View
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              backgroundColor: 'rgba(212, 175, 55, 0.08)',
              paddingHorizontal: spacing.md,
              paddingVertical: 5,
              borderRadius: borderRadius.full,
              borderWidth: 1,
              borderColor: 'rgba(212, 175, 55, 0.2)',
              marginBottom: spacing.md,
              gap: 6,
              maxWidth: '100%',
            }}
          >
            <Lock color={colors.primary} size={12} />
            <Text numberOfLines={2} style={{ color: colors.primary, fontSize: 10, fontWeight: '700', textAlign: 'center' }}>
              محادثة آمنة ومشفرة عبر خوادم TecnoRexa
            </Text>
          </View>

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
                جاري مزامنة الرسائل...
              </Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40, paddingHorizontal: spacing.lg }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
              <Text style={{ color: colors.white, fontSize: 15, fontWeight: 'bold' }}>
                لا توجد رسائل سابقة
              </Text>
              <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                ابدأ المحادثة الآن، رسائلك مشفرة ومحفوظة بأمان تام في سجل حسابك.
              </Text>
            </View>
          ) : (
            messages.map((msg) => {
              const timeStr = msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <View
                  key={msg.id}
                  style={{
                    alignSelf: msg.isMe ? 'flex-start' : 'flex-end',
                    backgroundColor: msg.isMe ? colors.primary : '#181818',
                    maxWidth: bubbleMaxWidth as any,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: borderRadius.lg,
                    borderBottomLeftRadius: msg.isMe ? 2 : borderRadius.lg,
                    borderBottomRightRadius: !msg.isMe ? 2 : borderRadius.lg,
                    marginBottom: spacing.sm,
                    borderWidth: msg.isMe ? 0 : 1,
                    borderColor: '#2A2A2A',
                  }}
                >
                  <Text
                    style={{
                      color: msg.isMe ? '#000000' : colors.white,
                      fontSize: msgFont,
                      lineHeight: msgLineHeight,
                      textAlign: 'right',
                      fontWeight: msg.isMe ? '700' : '500',
                    }}
                  >
                    {maskPhoneNumbers(msg.content)}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      marginTop: 4,
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: msg.isMe ? 'rgba(0,0,0,0.6)' : colors.gray,
                        fontSize: 10,
                        fontWeight: '600',
                      }}
                    >
                      {timeStr}
                    </Text>
                    {msg.isMe && (
                      <CheckCheck color={msg.read ? '#059669' : 'rgba(0,0,0,0.6)'} size={13} />
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'flex-end',
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: Math.max(10, insets.bottom || 10),
            backgroundColor: '#121212',
            borderTopWidth: 1,
            borderColor: '#222222',
            gap: 8,
            width: '100%',
            maxWidth: '100%',
            zIndex: 20,
          }}
        >
          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim() || sending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: message.trim() ? colors.primary : '#1E1E1E',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: message.trim() ? colors.primary : '#333333',
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Send color={message.trim() ? '#000000' : colors.gray} size={18} />
            )}
          </TouchableOpacity>

          {/* Text Input */}
          <View
            style={{
              flex: 1,
              flexDirection: 'row-reverse',
              alignItems: 'flex-end',
              backgroundColor: '#1A1A1A',
              borderRadius: 22,
              paddingHorizontal: spacing.md,
              paddingVertical: Platform.OS === 'ios' ? 8 : 6,
              borderWidth: 1,
              borderColor: '#2A2A2A',
              minWidth: 0,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                paddingVertical: Platform.OS === 'ios' ? 6 : 5,
                color: colors.white,
                textAlign: 'right',
                fontSize: compact ? 13 : 14,
                maxHeight: 96,
                minWidth: 0,
              }}
              placeholder="اكتب رسالتك هنا..."
              placeholderTextColor={colors.gray}
              value={message}
              onChangeText={setMessage}
              multiline
              onSubmitEditing={handleSend}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
