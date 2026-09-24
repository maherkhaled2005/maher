import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  Shield,
  Search,
  Clock,
  Globe,
  User,
  Filter,
  Trash2,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card, Loading } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { fetchApi } from '../../api/client';
import { normalizeRole } from '../../utils/permissions';
import OwnerHeader from '../../components/OwnerHeader';

// ===== أنواع البيانات =====
interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ip: string;
  createdAt: string;
}

// ===== الشاشة الرئيسية =====
export default function AuditLogsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role || 'customer');
  const isAdmin = role === 'owner' || role === 'manager';
  const isProgrammer = role === 'programmer';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/audit-logs');
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // تصفية حسب الرتبة
  const visibleLogs = isAdmin
    ? logs
    : isProgrammer
    ? logs.filter(l => l.userRole === 'programmer' || l.userId === user?.id)
    : [];

  const filteredLogs = visibleLogs.filter(l => {
    const matchSearch = (l.userName || '').includes(search) || (l.action || '').includes(search) || (l.details || '').includes(search);
    const matchRole = roleFilter === 'all' || l.userRole === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      owner: colors.owner,
      manager: colors.manager,
      programmer: colors.programmer,
      customer_support: colors.support,
      technician: colors.technician,
      merchant: colors.merchant,
      customer: colors.customer,
    };
    return map[role] || colors.gray;
  };

  if (loading) {
    return <Loading message="جاري تحميل السجل..." fullScreen />;
  }

  if (!isAdmin && !isProgrammer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <Shield color={colors.gray} size={48} />
        <Text style={{ color: colors.gray, fontSize: typography.sizes.lg, marginTop: spacing.md, textAlign: 'center' }}>
          غير مصرح لك بمشاهدة سجل العمليات
        </Text>
      </View>
    );
  }

  const handleCleanLogs = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('هل أنت متأكد من رغبتك في حذف السجلات الأمنية الأقدم من 6 أشهر؟ لا يمكن التراجع عن هذا الإجراء.')
      : true;
    if (!confirm) return;

    try {
      const res = await fetchApi('/owner/audit-logs/clean', { method: 'POST' });
      Alert.alert('✅ تم تنظيف السجل', res.message || 'تم حذف السجلات القديمة بنجاح.');
      await fetchLogs();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تنظيف السجل');
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* ☰ Owner Header with Drawer navigation */}
      <OwnerHeader
        title="سجل العمليات الأمني"
        subtitle={`كاميرات المراقبة وتتبع العمليات (${visibleLogs.length} حركة)`}
        sectionNumber={11}
        navigation={navigation}
        currentScreen="AuditLogs"
        showBack
        onRefresh={fetchLogs}
        rightAction={
          role === 'owner' ? (
            <TouchableOpacity
              onPress={handleCleanLogs}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                borderWidth: 1,
                borderColor: '#DC2626',
                borderRadius: borderRadius.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Trash2 size={14} color="#DC2626" />
              <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: 'bold' }}>تنظيف {'>'} 6 أشهر</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {/* البحث */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md }}>
          <Search color={colors.gray} size={20} />
          <TextInput
            style={{ flex: 1, padding: spacing.sm, color: colors.white, textAlign: 'right' }}
            placeholder="بحث بالمستخدم، العملية، التفاصيل..."
            placeholderTextColor={colors.gray}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* فلاتر الرتب */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {['all', 'owner', 'manager', 'programmer', 'customer_support', 'technician', 'merchant', 'customer'].map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => setRoleFilter(r)}
                style={{ paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.sm, backgroundColor: roleFilter === r ? colors.primary : colors.darkCard }}
              >
                <Text style={{ color: roleFilter === r ? colors.dark : colors.white, fontWeight: '700', fontSize: typography.sizes.xs }}>
                  {r === 'all' ? 'الكل' : r === 'owner' ? 'مالك' : r === 'manager' ? 'مدير' : r === 'programmer' ? 'مبرمج' : r === 'customer_support' ? 'دعم' : r === 'technician' ? 'فني' : r === 'merchant' ? 'تاجر' : 'عميل'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ===== قائمة السجلات ===== */}
      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: getRoleColor(item.userRole), fontWeight: '900', fontSize: typography.sizes.xs }}>
                  {item.userRole}
                </Text>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: typography.sizes.md }}>{item.userName}</Text>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: typography.sizes.md }}>{item.action}</Text>
                <Text style={{ color: colors.gray, fontSize: typography.sizes.sm, textAlign: 'right', marginTop: 4 }}>{item.details}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Globe color={colors.gray} size={14} />
                <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>{item.ip}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Clock color={colors.gray} size={14} />
                <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>
                  {new Date(item.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Shield color={colors.gray} size={48} />
            <Text style={{ color: colors.gray, fontSize: typography.sizes.lg, marginTop: spacing.md }}>لا توجد سجلات</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
