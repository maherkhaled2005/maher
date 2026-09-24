import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  Clock,
  User,
  Wrench,
  Trash2,
  X,
  Plus,
  ArrowLeft,
  ChevronRight,
  Code,
  Laptop,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { normalizeRole } from '../../roles';
import OwnerHeader from '../../components/OwnerHeader';

interface ErrorReport {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | string;
  assignedTo?: string;
  assignedName?: string;
  createdAt: string;
  environment?: string;
}

export default function ErrorReportsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const currentRole = normalizeRole(user?.role || '');
  const isOwner = currentRole === 'owner';
  const isManager = currentRole === 'manager';
  const isProgrammer = currentRole === 'programmer';

  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [programmers, setProgrammers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [selectedProgId, setSelectedProgId] = useState('');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Get bug reports
      const bugs = await fetchApi('/errors');
      if (Array.isArray(bugs)) {
        setReports(bugs);
      }

      // 2. Get programmers list
      const users = await fetchApi('/users');
      if (Array.isArray(users)) {
        const devs = users.filter((u) => normalizeRole(u.role) === 'programmer' || normalizeRole(u.role) === 'owner');
        setProgrammers(devs.length > 0 ? devs : users.slice(0, 5));
      }
    } catch (err: any) {
      console.warn('Error loading error reports:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [currentRole]);

  const filteredReports = reports.filter(
    (r) =>
      (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.id || '').includes(search)
  );

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return { label: 'حرج جداً 🔥', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)' };
      case 'high':
        return { label: 'مرتفع ⚠️', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
      case 'medium':
        return { label: 'متوسط ⚡', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { label: 'منخفض', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  // Open Assign Modal
  const openAssignModal = (rep: ErrorReport) => {
    setSelectedReport(rep);
    setSelectedProgId(programmers[0]?.id || '');
    setAssignModalVisible(true);
  };

  // Confirm Assign to Programmer
  const handleConfirmAssign = async () => {
    if (!selectedReport || !selectedProgId) return;
    const prog = programmers.find((p) => p.id === selectedProgId);

    try {
      await fetchApi(`/owner/errors/${selectedReport.id}/assign`, {
        method: 'POST',
        data: { programmerId: selectedProgId },
      });
      const updated = {
        ...selectedReport,
        assignedTo: selectedProgId,
        assignedName: prog?.name || selectedProgId,
        status: 'assigned',
      };
      setReports(reports.map((r) => (r.id === selectedReport.id ? updated : r)));
      setAssignModalVisible(false);
      Alert.alert('✅ تم الإسناد', `تم إسناد العطل البرمجي بنجاح إلى: ${prog?.name || selectedProgId}`);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إسناد الخطأ للمبرمج');
    }
  };

  // Change Bug Status (Programmer / Owner)
  const handleUpdateStatus = async (reportId: string, nextStatus: string) => {
    try {
      await fetchApi(`/errors/${reportId}/status`, {
        method: 'PUT',
        data: { status: nextStatus },
      }).catch(async () => {
        // Fallback endpoint if different route
        return fetchApi(`/admin/errors/${reportId}`, {
          method: 'PUT',
          data: { status: nextStatus },
        });
      });

      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: nextStatus } : r)));
      Alert.alert('✅ تم التحديث', `تم تحديث حالة الخطأ إلى: ${nextStatus === 'resolved' ? 'تم الحل' : 'قيد الإصلاح'}`);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تحديث حالة الخطأ');
    }
  };

  // Add Report
  const handleAddReport = async () => {
    if (!newTitle.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال ملخص العطل.');
      return;
    }

    try {
      const res = await fetchApi('/errors', {
        method: 'POST',
        data: {
          title: newTitle.trim(),
          description: newDesc.trim(),
          severity: newSeverity,
        },
      });

      const newRep: ErrorReport = {
        id: res.id || `ERR-${Date.now().toString().slice(-4)}`,
        title: newTitle.trim(),
        description: newDesc.trim(),
        severity: newSeverity,
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      setReports([newRep, ...reports]);
      setAddModalVisible(false);
      setNewTitle('');
      setNewDesc('');
      setNewSeverity('medium');
      Alert.alert('✅ تم التسجيل', 'تم تسجيل تقرير الخطأ البرمجي بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تسجيل الخطأ');
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* 1. Header with Role Awareness */}
      {isOwner || isManager || isProgrammer ? (
        <OwnerHeader
          title="تقارير الأخطاء التقنية"
          subtitle={`طوارئ البرمجة (${reports.length} تقرير مسجل)`}
          sectionNumber={12}
          navigation={navigation}
          currentScreen="ErrorReports"
          showBack={!!(navigation?.canGoBack && navigation.canGoBack())}
          onRefresh={loadData}
        />
      ) : (
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            backgroundColor: '#0F0F0F',
            borderBottomWidth: 1,
            borderColor: '#222',
          }}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
            {!!(navigation?.canGoBack && navigation.canGoBack()) && (
              <TouchableOpacity
                onPress={() => {
                  if (navigation?.canGoBack && navigation.canGoBack()) {
                    navigation.goBack();
                  } else if (navigation?.navigate) {
                    navigation.navigate('Home' as never);
                  }
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#1C1C1C',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#333',
                }}
              >
                <ChevronRight size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.white, fontSize: 17, fontWeight: '900' }}>
                سجل الأخطاء البرمجية (Bug Tracker) 🐞
              </Text>
              <Text style={{ color: colors.primary, fontSize: 11, marginTop: 2 }}>
                رصد ومعالجة المشاكل التقنية في النظام ({reports.length} تقرير)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={loadData}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: borderRadius.md,
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>تحديث 🔄</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Top Search Bar & Add */}
      <View style={{ backgroundColor: '#111111', padding: spacing.md, borderBottomWidth: 1, borderColor: '#222' }}>
        <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setAddModalVisible(true)}
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.md,
              gap: 6,
            }}
          >
            <Plus size={18} color="#0A0A0A" />
            <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 13 }}>تسجيل عطل</Text>
          </TouchableOpacity>

          <View
            style={{
              flex: 1,
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
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 6,
                textAlign: 'right',
                color: colors.white,
                fontSize: 13,
              }}
              placeholder="ابحث في تقارير الأخطاء..."
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

      {/* 3. Reports List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: spacing.sm }}>جاري تحميل تقارير الأخطاء...</Text>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <CheckCircle size={48} color="#10B981" />
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
            لا توجد أخطاء برمجية مسجلة
          </Text>
          <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            النظام يعمل بكفاءة ودون أي أعطال معلقة حالياً
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 150 }}
          renderItem={({ item }) => {
            const sevBadge = getSeverityBadge(item.severity);
            const isResolved = item.status === 'resolved';
            const isInProgress = item.status === 'in_progress';
            const isAssignedToMe = item.assignedTo === user?.id || (user?.name && item.assignedName?.includes(user.name));

            return (
              <View
                style={{
                  backgroundColor: '#141414',
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: item.severity === 'critical' ? '#DC2626' : '#222',
                  padding: spacing.md,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing.xs,
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 14 }}>#{item.id}</Text>
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        backgroundColor: sevBadge.bg,
                      }}
                    >
                      <Text style={{ color: sevBadge.color, fontSize: 10, fontWeight: '800' }}>{sevBadge.label}</Text>
                    </View>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: isResolved
                        ? 'rgba(16,185,129,0.15)'
                        : isInProgress
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(59,130,246,0.15)',
                    }}
                  >
                    <Text
                      style={{
                        color: isResolved ? '#10B981' : isInProgress ? '#F59E0B' : '#3B82F6',
                        fontSize: 11,
                        fontWeight: 'bold',
                      }}
                    >
                      {isResolved ? 'تم الحل ✅' : isInProgress ? 'قيد الإصلاح ⏳' : item.status === 'assigned' ? 'مسند لمبرمج 💻' : 'مفتوح ⏳'}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: colors.white, fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginVertical: 4 }}>
                  {item.title}
                </Text>

                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>
                  {item.description}
                </Text>

                <View
                  style={{
                    backgroundColor: '#1A1A1A',
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm,
                    marginVertical: spacing.xs,
                  }}
                >
                  <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right' }}>
                    المبرمج المسند إليه:{' '}
                    <Text style={{ color: item.assignedTo ? colors.primary : '#888', fontWeight: 'bold' }}>
                      {item.assignedName || item.assignedTo || 'لم يتم الإسناد بعد'}
                    </Text>
                  </Text>
                </View>

                {/* Actions: Assign + Status Progress */}
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: spacing.xs,
                    paddingTop: spacing.xs,
                    borderTopWidth: 1,
                    borderColor: '#1F1F1F',
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                    {/* Owner can reassign */}
                    {isOwner && (
                      <TouchableOpacity
                        onPress={() => openAssignModal(item)}
                        style={{
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: borderRadius.md,
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          borderWidth: 1,
                          borderColor: '#3B82F6',
                        }}
                      >
                        <Laptop size={13} color="#3B82F6" />
                        <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: 'bold' }}>إسناد لمبرمج</Text>
                      </TouchableOpacity>
                    )}

                    {/* Programmer can start work or resolve */}
                    {(isProgrammer || isOwner) && !isResolved && (
                      <>
                        {!isInProgress && (
                          <TouchableOpacity
                            onPress={() => handleUpdateStatus(item.id, 'in_progress')}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: borderRadius.md,
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              borderWidth: 1,
                              borderColor: '#F59E0B',
                            }}
                          >
                            <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: 'bold' }}>بدء المعالجة ⏳</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => handleUpdateStatus(item.id, 'resolved')}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: borderRadius.md,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            borderWidth: 1,
                            borderColor: '#10B981',
                          }}
                        >
                          <Text style={{ color: '#10B981', fontSize: 11, fontWeight: 'bold' }}>تم الإصلاح ✅</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  <Text style={{ color: '#666', fontSize: 11 }}>
                    {new Date(item.createdAt).toLocaleDateString('ar-EG')}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* MODAL 1: Assign to Programmer */}
      <Modal visible={assignModalVisible} transparent animationType="fade" onRequestClose={() => setAssignModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#3B82F6' }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '900' }}>إسناد الخطأ لمبرمج</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 }}>
              {selectedReport?.title || ''}
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: spacing.md }}>
              اختر المبرمج المسؤول ليظهر هذا الخطأ مباشرة في لوحة التطوير الخاصة به:
            </Text>

            <ScrollView style={{ maxHeight: 200, marginBottom: spacing.lg }}>
              <View style={{ gap: spacing.xs }}>
                {programmers.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedProgId(p.id)}
                    style={{
                      padding: spacing.md,
                      borderRadius: borderRadius.md,
                      backgroundColor: selectedProgId === p.id ? 'rgba(59, 130, 246, 0.2)' : '#1E1E1E',
                      borderWidth: 1,
                      borderColor: selectedProgId === p.id ? '#3B82F6' : '#333',
                      flexDirection: 'row-reverse',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: 'bold' }}>{p?.name || p?.id}</Text>
                    <Text style={{ color: colors.gray, fontSize: 11 }}>{p?.developerRank || p?.role || 'مطور'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)} style={{ flex: 1, padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: colors.white }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmAssign} style={{ flex: 1, padding: 10, backgroundColor: '#3B82F6', borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>تأكيد الإسناد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Add Bug Report */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900' }}>تسجيل عطل برمجي جديد</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>ملخص الخطأ *</Text>
            <TextInput
              style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
              placeholder="مثال: خطأ في مزامنة الرصيد عند الإيداع..."
              placeholderTextColor={colors.gray}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>مستوى الخطورة</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.xs, marginBottom: spacing.md }}>
              {['medium', 'high', 'critical'].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setNewSeverity(s)}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: borderRadius.sm,
                    backgroundColor: newSeverity === s ? colors.primary : '#1E1E1E',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: newSeverity === s ? '#0A0A0A' : colors.white, fontSize: 11, fontWeight: 'bold' }}>
                    {s === 'critical' ? 'حرج' : s === 'high' ? 'مرتفع' : 'متوسط'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>التفاصيل ومسار الحدوث</Text>
            <TextInput
              style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', minHeight: 70, textAlignVertical: 'top', marginBottom: spacing.lg }}
              placeholder="اكتب رسالة الخطأ أو تفاصيل المشكلة..."
              placeholderTextColor={colors.gray}
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={{ flex: 1, padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: colors.white }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddReport} style={{ flex: 1, padding: 10, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>تسجيل التقرير</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
