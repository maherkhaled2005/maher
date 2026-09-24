import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, SafeAreaView, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, RefreshControl,
  Linking,
} from 'react-native';
import { 
  Send, User, ArrowLeft, ChevronRight, Shield, Wrench, Code, Phone, Mail
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';

export default function TicketDetailsScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const ticketData = route?.params?.ticket || {};
  const isStaff = ['owner', 'manager', 'customer_support'].includes(user?.role || '');

  const [messages, setMessages] = useState<any[]>(
    ticketData.messages && Array.isArray(ticketData.messages) && ticketData.messages.length > 0
      ? ticketData.messages
      : (ticketData.description
        ? [
            {
              id: 'init_msg',
              senderType: 'customer',
              senderName: ticketData.client || ticketData.customerName || 'العميل',
              message: ticketData.description,
              createdAt: ticketData.createdAt || new Date().toISOString(),
            },
          ]
        : [])
  );
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadTicketDetails = async () => {
    if (!ticketData?.id) return;
    try {
      const data = await fetchApi(`/support/tickets/${ticketData.id}`);
      if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages);
      }
    } catch {}
  };

  useEffect(() => {
    loadTicketDetails();
  }, [ticketData?.id]);

  const handleSendReply = async () => {
    if (!inputText.trim() || sending) return;
    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await fetchApi(`/support/tickets/${ticketData.id}/reply`, {
        method: 'POST',
        data: { message: textToSend, text: textToSend },
      });
      if (res?.messages && Array.isArray(res.messages)) {
        setMessages(res.messages);
      } else {
        const newMsg = {
          id: `msg_${Date.now()}`,
          senderId: user?.id,
          senderType: isStaff ? 'staff' : 'customer',
          senderName: user?.name || (isStaff ? 'فريق الدعم الفني' : 'العميل'),
          message: textToSend,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMsg]);
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
    try {
      const res = await fetchApi(`/support/tickets/${ticketData.id}/actions`, {
        method: 'POST',
        data: { action },
      });
      Alert.alert('✅ تم الإجراء', res?.message || 'تم تحديث التذكرة بنجاح');
      loadTicketDetails();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تنفيذ الإجراء');
    }
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
          paddingVertical: spacing.md,
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
            width: 40,
            height: 40,
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

        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.md, fontWeight: '900' }}>
            #{ticketData.id || 'تذكرة دعم'}
          </Text>
          <Text style={{ color: colors.gray, fontSize: typography.sizes.sm, marginTop: 2 }}>
            {ticketData.client || ticketData.customerName || ticketData.subject || 'محادثة الدعم الفني'}
          </Text>
        </View>

        <View style={{ width: 40 }} />
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
            <Text style={{ color: '#7C3AED', fontSize: 11, fontWeight: 'bold' }}>تحويل لمبرمج (خطأ) 💻</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTicketAction('close')}
            style={{
              paddingHorizontal: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderWidth: 1,
              borderColor: '#10B981',
              borderRadius: borderRadius.md,
            }}
          >
            <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold' }}>إغلاق التذكرة ✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Customer Contact Details for Customer Support / Staff */}
      {(ticketData.customerPhone || ticketData.phone || ticketData.email || ticketData.userEmail || ticketData.customerName || ticketData.client) ? (
        <View
          style={{
            backgroundColor: '#18181B',
            paddingHorizontal: spacing.md,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: '#27272A',
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ alignItems: 'flex-end', flex: 1 }}>
            <Text style={{ color: colors.white, fontSize: 13, fontWeight: '800' }}>
              المرسل: {ticketData.customerName || ticketData.client || 'عميل'}
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: 14, marginTop: 4 }}>
              {(ticketData.customerPhone || ticketData.phone) ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${ticketData.customerPhone || ticketData.phone}`)}
                  style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}
                >
                  <Phone size={13} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
                    {ticketData.customerPhone || ticketData.phone}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {(ticketData.email || ticketData.userEmail) ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`mailto:${ticketData.email || ticketData.userEmail}`)}
                  style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}
                >
                  <Mail size={13} color="#3B82F6" />
                  <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '600' }}>
                    {ticketData.email || ticketData.userEmail}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={sending}
            onRefresh={() => {
              if (ticketData.id) {
                fetchApi(`/support/tickets/${ticketData.id}`)
                  .then(data => {
                    if (data && data.messages) setMessages(data.messages);
                  })
                  .catch(() => {});
              }
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        renderItem={({ item }) => {
          const isStaffMsg = item.senderType === 'staff' || item.isFromSupport === 1 || item.sender === 'agent';
          const isMe = item.senderId
            ? item.senderId === user?.id
            : (isStaff ? isStaffMsg : !isStaffMsg);
          const msgText = item.message || item.text || '';
          const senderLabel = item.senderName || (isStaffMsg ? 'فريق الدعم الفني' : 'العميل');
          const timeLabel = item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
            : (item.time || '');

          return (
            <View style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              backgroundColor: isMe ? colors.primary : colors.darkCard,
              maxWidth: '85%',
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.md,
              borderBottomRightRadius: isMe ? 0 : borderRadius.lg,
              borderBottomLeftRadius: !isMe ? 0 : borderRadius.lg,
            }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {isStaffMsg ? (
                  <Shield color={isMe ? colors.dark : colors.support} size={14} />
                ) : (
                  <User color={isMe ? colors.dark : colors.white} size={14} />
                )}
                <Text style={{ color: isMe ? colors.dark : colors.white, fontSize: typography.sizes.xs, fontWeight: '900' }}>
                  {senderLabel}
                </Text>
              </View>
              <Text style={{ color: isMe ? colors.dark : colors.white, fontSize: typography.sizes.md, textAlign: 'right', lineHeight: 22 }}>
                {msgText}
              </Text>
              {timeLabel ? (
                <View style={{ flexDirection: 'row', justifyContent: isMe ? 'flex-start' : 'flex-end', marginTop: 4 }}>
                  <Text style={{ color: isMe ? 'rgba(0,0,0,0.6)' : colors.gray, fontSize: 10 }}>{timeLabel}</Text>
                </View>
              ) : null}
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.darkCard, borderTopWidth: 1, borderColor: colors.border }}>
          <TouchableOpacity 
            onPress={handleSendReply}
            style={{ backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <Send color={colors.dark} size={20} />
          </TouchableOpacity>
          <TextInput
            style={{ flex: 1, backgroundColor: colors.dark, color: colors.white, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 10, marginLeft: spacing.md, textAlign: 'right', borderWidth: 1, borderColor: colors.border }}
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
