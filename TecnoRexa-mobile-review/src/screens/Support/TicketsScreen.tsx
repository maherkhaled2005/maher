import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  SafeAreaView, Alert, Platform, RefreshControl, Modal,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { 
  Search, ChevronRight, Copy, Headphones, Plus, X, Send, AlertCircle
} from 'lucide-react-native';
import { fetchApi } from '../../api/client';
import { colors, spacing, typography, borderRadius } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
  { id: 'فني', label: 'صيانة وفني 🛠️' },
  { id: 'مالي', label: 'دفع ومحفظة 💳' },
  { id: 'شكوى فني', label: 'شكوى بخصوص فني ⚠️' },
  { id: 'حسابات', label: 'الحساب وتسجيل الدخول 👤' },
  { id: 'عام', label: 'استفسار عام 📌' },
];

const PRIORITIES = [
  { id: 'low', label: 'عادي' },
  { id: 'medium', label: 'متوسط' },
  { id: 'urgent', label: 'عاجل جداً 🚨' },
];

export default function TicketsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'in_progress' | 'pending_customer' | 'closed'>('all');
  const [tickets, setTickets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // New Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [priority, setPriority] = useState('medium');
  const [phone, setPhone] = useState(user?.phone || '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetchApi('/support/tickets');
      if (Array.isArray(res)) setTickets(res);
      else if (res?.tickets && Array.isArray(res.tickets)) setTickets(res.tickets);
      else setTickets([]);
    } catch {
      setTickets([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة عنوان التذكرة وتفاصيل المشكلة');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/support/tickets', {
        method: 'POST',
        data: {
          subject: subject.trim(),
          title: subject.trim(),
          category,
          priority,
          customerPhone: phone.trim() || user?.phone || '',
          description: description.trim(),
        },
      });

      Alert.alert('تم بنجاح', 'تم فتح التذكرة وإرسالها لفريق الدعم الفني بنجاح');
      setSubject('');
      setDescription('');
      setIsModalOpen(false);

      if (res && res.id) {
        setTickets(prev => [res, ...prev]);
        navigation.navigate('TicketDetails', { ticket: res });
      } else {
        fetchTickets();
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل إرسال التذكرة، يرجى المحاولة لاحقاً');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    (selectedStatus === 'all' || t.status === selectedStatus) &&
    (searchQuery === '' || (t.subject || t.title || '').includes(searchQuery) || String(t.id).includes(searchQuery))
  );

  const handleCopyId = (id: string) => {
    Alert.alert('تم النسخ', `تم نسخ رقم التذكرة #${id}`);
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* ☰ Owner Header with 3 lines hamburger and back button */}
      <OwnerHeader
        title="خدمة العملاء والدعم الفني"
        subtitle={`غرفة الشكاوى ومتابعة التذاكر (${filteredTickets.length} تذكرة)`}
        sectionNumber={8}
        navigation={navigation}
        currentScreen="Tickets"
        showBack
        onRefresh={onRefresh}
      />

      <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border }}>
        {/* زر إنشاء تذكرة جديدة بارز (للعملاء والفنيين والتجار فقط - محجوب عن موظفي الدعم) */}
        {user?.role !== 'customer_support' && user?.role !== 'support' && (
          <TouchableOpacity
            onPress={() => {
              setPhone(user?.phone || '');
              setIsModalOpen(true);
            }}
            style={{
              backgroundColor: colors.primary,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
              gap: 8,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Plus color={colors.dark} size={20} />
            <Text style={{ color: colors.dark, fontSize: 15, fontWeight: '900' }}>
              ➕ فتح تذكرة جديدة / تقديم شكوى
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dark, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md }}>
          <Search color={colors.primary} size={20} />
          <TextInput
            placeholder="ابحث برقم التذكرة أو العنوان..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, textAlign: 'right', color: colors.white }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'open', label: 'مفتوحة' },
            { id: 'in_progress', label: 'جاري العمل' },
            { id: 'closed', label: 'مغلقة' },
          ].map(tab => (
            <TouchableOpacity 
              key={tab.id}
              onPress={() => setSelectedStatus(tab.id as any)}
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: selectedStatus === tab.id ? colors.primary : colors.darkCard, borderWidth: 1, borderColor: selectedStatus === tab.id ? colors.primary : colors.border }}
            >
              <Text style={{ color: selectedStatus === tab.id ? colors.dark : colors.gray, fontWeight: '900', fontSize: typography.sizes.xs }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* مودال فتح تذكرة جديدة */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 540, backgroundColor: colors.darkCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.primary, padding: spacing.lg, maxHeight: '90%' }}>
            
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: spacing.sm }}>
              <Text style={{ color: colors.primary, fontSize: typography.sizes.lg, fontWeight: '900' }}>
                فتح تذكرة دعم فني / تقديم شكوى
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={{ padding: 4 }}>
                <X color={colors.gray} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* تصنيف المشكلة */}
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                نوع المشكلة / القسم:
              </Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: borderRadius.sm,
                      backgroundColor: category === cat.id ? colors.primary : colors.dark,
                      borderWidth: 1,
                      borderColor: category === cat.id ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ color: category === cat.id ? colors.dark : colors.gray, fontSize: 12, fontWeight: '700' }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* الأولوية */}
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                درجة الأهمية:
              </Text>
              <View style={{ flexDirection: 'row-reverse', gap: 8, marginBottom: spacing.md }}>
                {PRIORITIES.map(pri => (
                  <TouchableOpacity
                    key={pri.id}
                    onPress={() => setPriority(pri.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 6,
                      borderRadius: borderRadius.sm,
                      alignItems: 'center',
                      backgroundColor: priority === pri.id ? (pri.id === 'urgent' ? colors.danger : colors.primary) : colors.dark,
                      borderWidth: 1,
                      borderColor: priority === pri.id ? (pri.id === 'urgent' ? colors.danger : colors.primary) : colors.border,
                    }}
                  >
                    <Text style={{ color: priority === pri.id ? colors.white : colors.gray, fontSize: 12, fontWeight: '700' }}>
                      {pri.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* العنوان */}
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                عنوان المشكلة أو الاستفسار *:
              </Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="مثال: مشكلة في موعد صيانة التكييف / عطل فني"
                placeholderTextColor={colors.gray}
                style={{
                  backgroundColor: colors.dark,
                  color: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  textAlign: 'right',
                  marginBottom: spacing.md,
                  fontSize: 14,
                }}
              />

              {/* رقم الهاتف للتواصل */}
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                رقم الهاتف للتواصل:
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="010XXXXXXXX"
                placeholderTextColor={colors.gray}
                keyboardType="phone-pad"
                style={{
                  backgroundColor: colors.dark,
                  color: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  textAlign: 'right',
                  marginBottom: spacing.md,
                  fontSize: 14,
                }}
              />

              {/* التفاصيل والشرح */}
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                تفاصيل المشكلة والشكوى بالكامل *:
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="اشرح المشكلة بالتفصيل ليتمكن فريق الدعم والفنيون من مساعدتك فوراً..."
                placeholderTextColor={colors.gray}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: colors.dark,
                  color: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  textAlign: 'right',
                  height: 100,
                  textAlignVertical: 'top',
                  marginBottom: spacing.lg,
                  fontSize: 14,
                }}
              />

              {/* زر الإرسال */}
              <TouchableOpacity
                onPress={handleCreateTicket}
                disabled={submitting}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row-reverse',
                  gap: 8,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.dark} />
                ) : (
                  <>
                    <Send color={colors.dark} size={18} />
                    <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>
                      إرسال التذكرة الآن
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredTickets}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Headphones size={48} color={colors.gray} />
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
              لا توجد تذاكر دعم حالياً
            </Text>
            <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              تذاكر واستفسارات المستخدمين والعملاء ستظهر هنا فور إرسالها
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigation.navigate('TicketDetails', { ticket: item })}
            style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ backgroundColor: item.status === 'open' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm }}>
                  <Text style={{ color: item.status === 'open' ? colors.danger : colors.primary, fontSize: typography.sizes.xs, fontWeight: '900' }}>
                    {item.status === 'open' ? 'تذكرة مفتوحة' : item.status === 'closed' ? 'مغلقة' : 'جاري العمل'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => handleCopyId(item.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.dark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border }}
              >
                <Copy color={colors.gray} size={12} />
                <Text style={{ color: colors.white, fontSize: typography.sizes.xs, fontWeight: '700' }}>#{item.id}</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.white, fontSize: typography.sizes.md, fontWeight: '900', textAlign: 'right', marginBottom: spacing.sm }}>
              {item.subject || item.title || 'طلب مساعدة'}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: colors.gray, fontSize: typography.sizes.xs, fontWeight: '700' }}>{item.client || item.customerName || 'عميل'}</Text>
              </View>
              <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>{item.date || item.createdAt || 'اليوم'}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: spacing.sm, gap: 4 }}>
              <ChevronRight color={colors.primary} size={16} />
              <Text style={{ color: colors.primary, fontSize: typography.sizes.sm, fontWeight: '900' }}>فتح التذكرة والرد</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
