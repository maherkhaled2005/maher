import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronRight,
  Phone,
  Video,
  Send,
  Lock,
  CheckCheck,
  User,
  RefreshCw,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';

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
  const { chatId, userName, isOnline, phone } = route.params || {
    chatId: 'default',
    userName: 'محادثة',
    isOnline: true,
    phone: '01000000000',
  };

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const loadMessages = useCallback(async (silent = false) => {
    if (!chatId) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/messages/${chatId}`);
      if (Array.isArray(res.data)) {
        setMessages((prev) => {
          const fetched = res.data.map((m: any) => ({
            ...m,
            isMe: m.senderId === user?.id,
          }));
          // Preserve any temp messages that haven't been resolved yet
          const tempMsgs = prev.filter(m => String(m.id).startsWith('temp_'));
          // Avoid duplicates if server already returned the newly inserted msg
          const newFetchedIds = new Set(fetched.map((f: any) => f.id));
          return [...fetched, ...tempMsgs.filter(t => !newFetchedIds.has(t.id))];
        });
      }
    } catch (err: any) {
      console.warn('Error fetching messages:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [chatId, user?.id]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => {
      loadMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
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

    try {
      const res = await api.post('/messages', {
        conversationId: chatId,
        content: text,
        type: 'text',
      });
      if (res.data && res.data.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...res.data, isMe: true } : m))
        );
      }
    } catch (err: any) {
      console.warn('Failed to send message:', err.message);
    } finally {
      setSending(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleCall = () => {
    const tel = phone || '01000000000';
    Linking.openURL(`tel:${tel}`).catch(() => {});
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: '#111111',
          borderBottomWidth: 1,
          borderColor: '#222222',
        }}
      >
        {/* Right side: Back button & Contact Info */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
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
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <User color={colors.primary} size={22} />
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.white, fontSize: 15, fontWeight: '800' }}>
              {userName}
            </Text>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isOnline !== false ? colors.success : colors.gray,
                }}
              />
              <Text style={{ color: colors.gray, fontSize: 11 }}>
                {isOnline !== false ? 'متصل الآن' : 'غير متصل'}
              </Text>
            </View>
          </View>
        </View>

        {/* Left side: Action icons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
            <Video color={colors.white} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xl,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
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
            paddingVertical: 4,
            borderRadius: borderRadius.full,
            borderWidth: 1,
            borderColor: 'rgba(212, 175, 55, 0.2)',
            marginBottom: spacing.md,
            gap: 6,
          }}
        >
          <Lock color={colors.primary} size={12} />
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
            محادثة آمنة ومشفرة عبر خوادم TecnoRexa
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.gray, fontSize: 13, marginTop: 8 }}>
              جاري مزامنة الرسائل...
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.lg }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>💬</Text>
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold' }}>
              لا توجد رسائل سابقة
            </Text>
            <Text style={{ color: colors.gray, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
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
                  maxWidth: '82%',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
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
                    fontSize: 14,
                    lineHeight: 20,
                    textAlign: 'right',
                    fontWeight: msg.isMe ? '700' : '500',
                  }}
                >
                  {msg.content}
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            backgroundColor: '#121212',
            borderTopWidth: 1,
            borderColor: '#222222',
            gap: 8,
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
              alignItems: 'center',
              backgroundColor: '#1A1A1A',
              borderRadius: 22,
              paddingHorizontal: spacing.md,
              borderWidth: 1,
              borderColor: '#2A2A2A',
            }}
          >
            <TextInput
              style={{
                flex: 1,
                paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                color: colors.white,
                textAlign: 'right',
                fontSize: 14,
                maxHeight: 100,
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
