import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import {
  Megaphone,
  Tag,
  BarChart3,
  Plus,
  Send,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  Percent,
  ArrowLeft,
  Crown,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';

interface Coupon {
  id: string;
  code: string;
  discount: number;
  expiry: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
}

interface Campaign {
  id: string;
  title: string;
  targetRole: string;
  sentCount: number;
  openRate: number;
  conversionRate: number;
  date: string;
}

export default function MarketingScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'coupons' | 'analytics'>('campaigns');

  // Campaigns State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Modal State for New Campaign
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [campTitle, setCampTitle] = useState('');
  const [campBody, setCampBody] = useState('');
  const [campTarget, setCampTarget] = useState('all');

  // Modal State for New Coupon
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [coupCode, setCoupCode] = useState('');
  const [coupDiscount, setCoupDiscount] = useState('');
  const [coupUses, setCoupUses] = useState('');
  const [coupExpiry, setCoupExpiry] = useState('');

  const handleSendCampaign = () => {
    if (!campTitle.trim() || !campBody.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة عنوان الحملة ونص الإشعار');
      return;
    }
    const newCamp: Campaign = {
      id: `c_${Date.now()}`,
      title: campTitle,
      targetRole: campTarget === 'all' ? 'جميع المستخدمين' : campTarget,
      sentCount: 1,
      openRate: 0,
      conversionRate: 0,
      date: new Date().toISOString().split('T')[0],
    };
    setCampaigns([newCamp, ...campaigns]);
    setCampaignModalVisible(false);
    setCampTitle('');
    setCampBody('');
    Alert.alert('✅ تم إطلاق الحملة', 'تم إرسال الحملة الإعلانية بنجاح للمستخدمين المستهدفين.');
  };

  const handleCreateCoupon = () => {
    if (!coupCode.trim() || !coupDiscount.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال كود الكوبون ونسبة الخصم');
      return;
    }
    const newCoup: Coupon = {
      id: `cp_${Date.now()}`,
      code: coupCode.toUpperCase().trim(),
      discount: Number(coupDiscount),
      expiry: coupExpiry || '2026-12-31',
      maxUses: Number(coupUses) || 100,
      usedCount: 0,
      active: true,
    };
    setCoupons([newCoup, ...coupons]);
    setCouponModalVisible(false);
    setCoupCode('');
    setCoupDiscount('');
    setCoupUses('');
    Alert.alert('✅ تم إنشاء الكوبون', `تم تفعيل الكوبون ${newCoup.code} بنسبة خصم ${newCoup.discount}%`);
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.dark }, ]}>
      {/* ☰ Owner Header with Drawer navigation */}
      <OwnerHeader
        title="قسم التسويق والحملات"
        subtitle="البوق الإعلامي وإدارة الكوبونات"
        sectionNumber={14}
        navigation={navigation}
        currentScreen="Marketing"
        showBack
      />

      {/* Tabs */}
      <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.darkCard }}>
        <TouchableOpacity
          onPress={() => setActiveTab('campaigns')}
          style={{ flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: activeTab === 'campaigns' ? colors.primary : 'transparent' }}
        >
          <Text style={{ color: activeTab === 'campaigns' ? colors.dark : colors.gray, fontWeight: '900', fontSize: 13 }}>📢 الحملات</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('coupons')}
          style={{ flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: activeTab === 'coupons' ? colors.primary : 'transparent' }}
        >
          <Text style={{ color: activeTab === 'coupons' ? colors.dark : colors.gray, fontWeight: '900', fontSize: 13 }}>🏷️ الكوبونات</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('analytics')}
          style={{ flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: activeTab === 'analytics' ? colors.primary : 'transparent' }}
        >
          <Text style={{ color: activeTab === 'analytics' ? colors.dark : colors.gray, fontWeight: '900', fontSize: 13 }}>📊 التحليلات</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: 150 }}>
        {/* TAB 1: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <TouchableOpacity
                onPress={() => setCampaignModalVisible(true)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, gap: 6 }}
              >
                <Plus size={16} color={colors.dark} />
                <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 13 }}>حملة جديدة</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>حملات الإشعارات النشطة</Text>
            </View>

            <View style={{ gap: spacing.md }}>
              {campaigns.length === 0 ? (
                <View style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.lg, padding: spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
                  <Megaphone size={36} color={colors.gray} style={{ marginBottom: 8 }} />
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: 14 }}>لا توجد حملات إعلانية حالياً</Text>
                  <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4 }}>اضغط على "حملة جديدة" لإطلاق أولى حملاتك التسويقية الموجهة</Text>
                </View>
              ) : (
                campaigns.map((camp) => (
                  <View key={camp.id} style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15, textAlign: 'right', marginBottom: 6 }}>{camp.title}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border + '55', paddingTop: spacing.sm }}>
                      <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>فتح: {camp.openRate}%</Text>
                        <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>تحويل: {camp.conversionRate}%</Text>
                      </View>
                      <Text style={{ color: colors.gray, fontSize: 12 }}>الجمهور: {camp.targetRole} | {camp.date}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* TAB 2: COUPONS */}
        {activeTab === 'coupons' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <TouchableOpacity
                onPress={() => setCouponModalVisible(true)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, gap: 6 }}
              >
                <Plus size={16} color={colors.dark} />
                <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 13 }}>كوبون جديد</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>أكواد الخصم النشطة</Text>
            </View>

            <View style={{ gap: spacing.md }}>
              {coupons.length === 0 ? (
                <View style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.lg, padding: spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
                  <Tag size={36} color={colors.gray} style={{ marginBottom: 8 }} />
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: 14 }}>لا توجد أكواد خصم حالياً</Text>
                  <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4 }}>اضغط على "كوبون جديد" لإنشاء أول كود خصم لمنصتك</Text>
                </View>
              ) : (
                coupons.map((cp) => (
                  <View key={cp.id} style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setCoupons(coupons.filter(c => c.id !== cp.id))}>
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 18 }}>{cp.code}</Text>
                        <Tag size={16} color={colors.primary} />
                      </View>
                      <Text style={{ color: colors.gray, fontSize: 12 }}>خصم {cp.discount}% | الاستخدام: {cp.usedCount} من {cp.maxUses} | حتى {cp.expiry}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === 'analytics' && (
          <View style={{ gap: spacing.md }}>
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'right' }}>مؤشرات فاعلية التسويق</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1, backgroundColor: colors.darkCard, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '900' }}>0.0%</Text>
                <Text style={{ color: colors.gray, fontSize: 12 }}>متوسط معدل الفتح</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.darkCard, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                <Text style={{ color: '#10B981', fontSize: 24, fontWeight: '900' }}>0.0%</Text>
                <Text style={{ color: colors.gray, fontSize: 12 }}>معدل التحويل للطلب</Text>
              </View>
            </View>
            <View style={{ backgroundColor: colors.darkCard, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.white, fontWeight: '900', textAlign: 'right', marginBottom: 8 }}>أكثر الكوبونات استخداماً</Text>
              <Text style={{ color: colors.gray, textAlign: 'right', fontSize: 13 }}>لا توجد بيانات استخدام حتى الآن. ستظهر المؤشرات تلقائياً عند تفاعل العملاء مع الكوبونات.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal: New Campaign */}
      <Modal visible={campaignModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.primary }}>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: spacing.md }}>إنشاء حملة إعلانية جديدة 📢</Text>
            <TextInput
              style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.md, padding: spacing.md, color: colors.white, textAlign: 'right', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}
              placeholder="عنوان الحملة أو العرض"
              placeholderTextColor={colors.gray}
              value={campTitle}
              onChangeText={setCampTitle}
            />
            <TextInput
              style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.md, padding: spacing.md, color: colors.white, textAlign: 'right', height: 100, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}
              placeholder="نص الإشعار الترويجي الكامل..."
              placeholderTextColor={colors.gray}
              multiline
              value={campBody}
              onChangeText={setCampBody}
            />
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              <TouchableOpacity onPress={() => setCampaignModalVisible(false)} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.darkCard, alignItems: 'center' }}>
                <Text style={{ color: colors.gray, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendCampaign} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' }}>
                <Text style={{ color: colors.dark, fontWeight: '900' }}>إرسال فوري 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: New Coupon */}
      <Modal visible={couponModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.primary }}>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: spacing.md }}>إنشاء كود خصم جديد 🏷️</Text>
            <TextInput
              style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.md, padding: spacing.md, color: colors.white, textAlign: 'right', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}
              placeholder="كود الخصم (مثال: SAVE25)"
              placeholderTextColor={colors.gray}
              value={coupCode}
              onChangeText={setCoupCode}
            />
            <TextInput
              style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.md, padding: spacing.md, color: colors.white, textAlign: 'right', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}
              placeholder="نسبة الخصم % (مثال: 20)"
              placeholderTextColor={colors.gray}
              keyboardType="numeric"
              value={coupDiscount}
              onChangeText={setCoupDiscount}
            />
            <TextInput
              style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.md, padding: spacing.md, color: colors.white, textAlign: 'right', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}
              placeholder="الحد الأقصى لمرات الاستخدام"
              placeholderTextColor={colors.gray}
              keyboardType="numeric"
              value={coupUses}
              onChangeText={setCoupUses}
            />
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              <TouchableOpacity onPress={() => setCouponModalVisible(false)} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.darkCard, alignItems: 'center' }}>
                <Text style={{ color: colors.gray, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateCoupon} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' }}>
                <Text style={{ color: colors.dark, fontWeight: '900' }}>حفظ وتفعيل ✨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
