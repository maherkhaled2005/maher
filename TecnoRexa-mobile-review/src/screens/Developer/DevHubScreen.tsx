import React, { useState, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import {
  Code,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  ChevronRight,
  X,
  MessageSquare,
  BarChart2,
  Users,
  Crown,
  Zap,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card, Button, Input, Loading } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { fetchApi } from '../../api/client';
import { normalizeRole, isProgrammer } from '../../utils/permissions';
import OwnerHeader from '../../components/OwnerHeader';

// ===== أنواع البيانات =====
interface DevTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in_progress' | 'review' | 'done';
  progress: number;
  deadline: string;
  createdAt: string;
}

// ===== مكون بطاقة المهمة =====
const TaskCard = ({
  task,
  isLead,
  canManage,
  onStatusChange,
  onDelete,
}: {
  task: DevTask;
  isLead: boolean;
  canManage: boolean;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) => {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'critical': return colors.danger;
      case 'high': return colors.warning;
      case 'medium': return colors.info;
      case 'low': return colors.success;
    }
  };

  const getStatusLabel = () => {
    switch (task.status) {
      case 'new': return 'جديدة 🆕';
      case 'in_progress': return 'قيد التطوير ⏳';
      case 'review': return 'مراجعة 👀';
      case 'done': return 'مكتملة ✅';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'new': return colors.info;
      case 'in_progress': return colors.warning;
      case 'review': return colors.purple;
      case 'done': return colors.success;
    }
  };

  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {canManage && (
            <TouchableOpacity onPress={() => onDelete(task.id)}>
              <Trash2 color={colors.danger} size={18} />
            </TouchableOpacity>
          )}
          <Text style={{ color: getPriorityColor(), fontSize: typography.sizes.xs, fontWeight: '900' }}>
            {task.priority === 'critical' ? '🔴 حرجة' :
             task.priority === 'high' ? '🟠 عالية' :
             task.priority === 'medium' ? '🟡 متوسطة' : '🟢 منخفضة'}
          </Text>
        </View>
        <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>#{task.id}</Text>
      </View>

      <Text style={{ color: colors.white, fontWeight: '900', fontSize: typography.sizes.md, textAlign: 'right', marginTop: spacing.xs }}>
        {task.title}
      </Text>
      <Text style={{ color: colors.gray, fontSize: typography.sizes.sm, textAlign: 'right', marginTop: 4 }}>
        {task.description}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <User color={colors.gray} size={14} />
          <Text style={{ color: colors.white, fontSize: typography.sizes.xs }}>{task.assignedToName || task.assignedTo || 'غير معين'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Calendar color={colors.gray} size={14} />
          <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>{task.deadline || 'اليوم'}</Text>
        </View>
      </View>

      {/* شريط التقدم */}
      <View style={{ height: 4, backgroundColor: colors.dark, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' }}>
        <View style={{ height: 4, width: `${task.progress}%`, backgroundColor: getStatusColor(), borderRadius: 2 }} />
      </View>

      {/* أزرار تغيير الحالة (للمبرمج العادي) */}
      {!canManage && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          {task.status === 'new' && (
            <Button title="بدء العمل ⏳" onPress={() => onStatusChange(task.id, 'in_progress')} variant="primary" size="sm" />
          )}
          {task.status === 'in_progress' && (
            <Button title="تم الإصلاح (إرسال للمراجعة) 👀" onPress={() => onStatusChange(task.id, 'review')} variant="success" size="sm" />
          )}
          {task.status === 'review' && (
            <Button title="تحت المراجعة" onPress={() => {}} variant="secondary" size="sm" disabled />
          )}
        </View>
      )}

      {/* أزرار المساعد والمسؤول التقني */}
      {canManage && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          {task.status !== 'in_progress' && (
            <Button title="← للتطوير" onPress={() => onStatusChange(task.id, 'in_progress')} variant="outline" size="sm" />
          )}
          {task.status !== 'done' && (
            <Button title="✓ اعتماد الإنجاز" onPress={() => onStatusChange(task.id, 'done')} variant="success" size="sm" />
          )}
        </View>
      )}

      <Text style={{ color: colors.gray, fontSize: typography.sizes.xs, textAlign: 'right', marginTop: spacing.xs }}>
        {getStatusLabel()} • {task.progress}%
      </Text>
    </Card>
  );
};

// ===== مودال الإصلاح السريع للأخطاء =====
const QuickFixModal = ({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, solution: string) => void;
}) => {
  const [bugTitle, setBugTitle] = useState('');
  const [solution, setSolution] = useState('');

  const handleFix = () => {
    if (!bugTitle.trim() || !solution.trim()) {
      const msg = 'يرجى كتابة عنوان الخطأ وتفاصيل الإصلاح السريع';
      if (Platform.OS === 'web') window.alert('تنبيه: ' + msg);
      else Alert.alert('تنبيه', msg);
      return;
    }
    onSubmit(bugTitle, solution);
    setBugTitle('');
    setSolution('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
        <View style={{ width: '100%', maxWidth: 480, backgroundColor: '#18181B', borderRadius: borderRadius.xl, padding: spacing.xl, borderWidth: 1.5, borderColor: '#F59E0B' }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
              <Zap color="#F59E0B" size={24} />
              <Text style={{ color: '#F59E0B', fontSize: 16, fontWeight: '900' }}>إصلاح خطأ سريع ⚡ (المبرمج المساعد)</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.gray} size={22} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: spacing.md, lineHeight: 18 }}>
            يستخدم بواسطة المبرمج المساعد لمعالجة الأخطاء الطارئة فورياً وتوثيقها في النظام في حالة عدم وجود قائد التطوير أو المالك 🛠️
          </Text>

          <Input label="عنوان الخطأ البرمجي / المشكلة" placeholder="مثال: بطء استجابة الاستعلام في الشات" value={bugTitle} onChangeText={setBugTitle} />
          <Input label="تفاصيل وحل الإصلاح السريع" placeholder="تم تعديل الاستعلام وترقية الفهرس الفوري..." value={solution} onChangeText={setSolution} multiline numberOfLines={3} />

          <Button title="اعتماد الإصلاح وتوثيقه ⚡" onPress={handleFix} variant={"warning" as any} fullWidth style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </Modal>
  );
};

// ===== مودال إنشاء مهمة وتعيينها =====
const CreateTaskModal = ({
  visible,
  onClose,
  onSubmit,
  devTeam = [],
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  devTeam?: any[];
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [assignee, setAssignee] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      const msg = 'يرجى إدخال عنوان المهمة';
      if (Platform.OS === 'web') window.alert('تنبيه: ' + msg);
      else Alert.alert('تنبيه', msg);
      return;
    }
    onSubmit({ title, description, priority, assignee: assignee || 'المبرمج العادي', deadline });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAssignee('');
    setDeadline('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
        <View style={{ width: '100%', maxWidth: 480, backgroundColor: colors.darkCard, borderRadius: borderRadius.xl, padding: spacing.xl }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={{ color: colors.white, fontSize: typography.sizes.xl, fontWeight: '900' }}>تنزيل مهمة جديدة ➕</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.gray} size={24} />
            </TouchableOpacity>
          </View>

          <Input label="عنوان المهمة البرمجية *" value={title} onChangeText={setTitle} placeholder="مثال: إصلاح شاشة إعدادات النظام" />
          <Input label="وصف المهمة والمطلوب" value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholder="تفاصيل الخطأ أو الخاصية المطلوبة..." />

          <Text style={{ color: colors.white, fontWeight: '700', textAlign: 'right', marginBottom: spacing.xs }}>الأولوية</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            {['low', 'medium', 'high', 'critical'].map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p as any)}
                style={{ flex: 1, padding: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: priority === p ? colors.primary : colors.dark, alignItems: 'center' }}
              >
                <Text style={{ color: priority === p ? colors.dark : colors.white, fontWeight: '700', fontSize: typography.sizes.xs }}>
                  {p === 'low' ? 'منخفضة' : p === 'medium' ? 'متوسطة' : p === 'high' ? 'عالية' : 'حرجة'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="إسناد إلى المبرمج (اختياري)" value={assignee} onChangeText={setAssignee} placeholder="المبرمج العادي / اسم المبرمج" />
          {devTeam.length > 0 && (
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
              {devTeam.map(dev => (
                <TouchableOpacity
                  key={dev.id}
                  onPress={() => setAssignee(dev.name)}
                  style={{
                    backgroundColor: assignee === dev.name ? colors.primary : '#1F1F23',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: borderRadius.sm,
                    borderWidth: 1,
                    borderColor: '#333',
                  }}
                >
                  <Text style={{ color: assignee === dev.name ? '#0A0A0A' : '#A1A1AA', fontSize: 11, fontWeight: '700' }}>
                    👤 {dev.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Input label="تاريخ التسليم (YYYY-MM-DD)" value={deadline} onChangeText={setDeadline} placeholder="2026-09-20" />

          <Button title="تنزيل وإسناد المهمة 🚀" onPress={handleSubmit} variant="primary" fullWidth />
        </View>
      </View>
    </Modal>
  );
};

// ===== الشاشة الرئيسية =====
export default function DevHubScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';
  const isLead = isOwner || !!(user?.developerRank === 'lead' || (user as any)?.programmerLevel === 'lead');
  const isAssistant = isLead || !!(user?.developerRank === 'assistant' || user?.role === 'programmer_assistant');
  const canManageTasks = isLead || isAssistant;
  const currentUser = user?.name || '';

  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuickFixModal, setShowQuickFixModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Dev Team State
  const [activeTab, setActiveTab] = useState<'tasks' | 'team'>('tasks');
  const [devTeam, setDevTeam] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/dev/tasks');
      setTasks(data || []);
    } catch (error) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevTeam = async () => {
    setLoadingTeam(true);
    try {
      const data = await fetchApi('/programmer/team');
      if (Array.isArray(data)) setDevTeam(data);
    } catch {
      setDevTeam([]);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handlePromoteDev = async (userId: string) => {
    try {
      await fetchApi('/programmer/promote-developer', {
        method: 'POST',
        data: { userId, newRank: 'assistant' },
      });
      const msg = 'تمت ترقية المبرمج إلى رتبة مبرمج مساعد بنجاح ⚡';
      if (Platform.OS === 'web') window.alert('✅ ' + msg);
      else Alert.alert('✅ تم بنجاح', msg);
      fetchDevTeam();
    } catch (err: any) {
      const msg = err.message || 'تعذر ترقية المبرمج';
      if (Platform.OS === 'web') window.alert('خطأ: ' + msg);
      else Alert.alert('خطأ', msg);
    }
  };

  const handleQuickFix = async (title: string, solution: string) => {
    try {
      await fetchApi('/dev/quick-fix', {
        method: 'POST',
        data: { title, description: solution },
      });
      const msg = 'تم إنجاز وتوثيق الإصلاح السريع بنجاح في سجلات النظام ⚡';
      if (Platform.OS === 'web') window.alert('⚡ تم الإصلاح: ' + msg);
      else Alert.alert('⚡ تم الإصلاح بنجاح', msg);
      fetchTasks();
    } catch (err: any) {
      const msg = err.message || 'فشل تنفيذ الإصلاح السريع';
      if (Platform.OS === 'web') window.alert('خطأ: ' + msg);
      else Alert.alert('خطأ', msg);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchDevTeam();
    if (!isOwner) {
      fetchApi('/dev/onboarding')
        .then((res: any) => {
          if (res && !res.completed) {
            setShowOnboardingModal(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'team') {
      fetchDevTeam();
    }
  }, [activeTab]);

  const handleAgreeOnboarding = async () => {
    try {
      await fetchApi('/dev/onboarding/agree', { method: 'POST' });
      setShowOnboardingModal(false);
      const msg = 'تم توثيق موافقتك على ميثاق وقوانين المبرمجين بنجاح.';
      if (Platform.OS === 'web') window.alert('✅ ' + msg);
      else Alert.alert('✅ مرحباً بك في غرفة التطوير', msg);
    } catch {
      setShowOnboardingModal(false);
    }
  };

  // تصفية المهام حسب الرتبة
  const visibleTasks = canManageTasks
    ? tasks
    : tasks.filter(
        (t) =>
          !t.assignedTo ||
          (t.assignedTo && t.assignedTo === user?.id) ||
          (t.assignedToName && (t.assignedToName === currentUser || currentUser.includes(t.assignedToName) || t.assignedToName.includes('العادي')))
      );

  const newTasks = visibleTasks.filter(t => t.status === 'new');
  const inProgressTasks = visibleTasks.filter(t => t.status === 'in_progress');
  const reviewTasks = visibleTasks.filter(t => t.status === 'review');
  const doneTasks = visibleTasks.filter(t => t.status === 'done');

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await fetchApi(`/dev/tasks/${taskId}/status`, { method: 'PUT', data: { status: newStatus } });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
      const msg = `تم تغيير حالة المهمة إلى ${newStatus}`;
      if (Platform.OS === 'web') window.alert('تم التحديث: ' + msg);
      else Alert.alert('تم التحديث', msg);
    } catch (error) {
      if (Platform.OS === 'web') window.alert('خطأ: فشل تغيير الحالة');
      else Alert.alert('خطأ', 'فشل تغيير الحالة');
    }
  };

  const handleDelete = async (taskId: string) => {
    const doDelete = async () => {
      try {
        await fetchApi(`/dev/tasks/${taskId}`, { method: 'DELETE' });
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (Platform.OS === 'web') window.alert('تم الحذف: تم حذف المهمة بنجاح');
        else Alert.alert('تم الحذف', 'تم حذف المهمة بنجاح');
      } catch (error) {
        if (Platform.OS === 'web') window.alert('خطأ: فشل حذف المهمة');
        else Alert.alert('خطأ', 'فشل حذف المهمة');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) doDelete();
    } else {
      Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذه المهمة؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleCreateTask = async (data: any) => {
    try {
      const newTask = await fetchApi('/dev/tasks', { method: 'POST', data });
      setTasks([newTask, ...tasks]);
      const msg = 'تم تنزيل المهمة وإسنادها بنجاح 🚀';
      if (Platform.OS === 'web') window.alert('تم الإسناد: ' + msg);
      else Alert.alert('تم الإنشاء', msg);
    } catch (error) {
      if (Platform.OS === 'web') window.alert('خطأ: فشل إنشاء المهمة');
      else Alert.alert('خطأ', 'فشل إنشاء المهمة');
    }
  };

  if (loading) {
    return <Loading message="جاري تحميل المهام والبيانات البرمجية..." fullScreen />;
  }

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.dark }]}>
      {/* ☰ Header with Role Awareness */}
      {user?.role === 'owner' || normalizeRole(user?.role || '') === 'programmer' ? (
        <OwnerHeader
          title="مركز المطورين (Dev Hub)"
          subtitle={`غرفة العمليات البرمجية 💻 | ${isLead ? '👑 المسؤول التقني' : isAssistant ? '⚡ المبرمج المساعد' : '💻 المبرمج العادي'}`}
          sectionNumber={13}
          navigation={navigation}
          currentScreen="DevHub"
          showBack={!!(navigation?.canGoBack && navigation.canGoBack())}
          onRefresh={fetchTasks}
          rightAction={
            canManageTasks ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.primary,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: borderRadius.md,
                    gap: 4,
                  }}
                >
                  <Plus size={14} color="#0A0A0A" />
                  <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 11 }}>تنزيل مهمة</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowQuickFixModal(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F59E0B',
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: borderRadius.md,
                    gap: 4,
                  }}
                >
                  <Zap size={14} color="#0A0A0A" />
                  <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 11 }}>إصلاح سريع ⚡</Text>
                </TouchableOpacity>
              </View>
            ) : undefined
          }
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
                مركز المطورين (Dev Hub) 💻
              </Text>
              <Text style={{ color: colors.primary, fontSize: 11, marginTop: 2 }}>
                {isLead ? '👑 المسؤول التقني' : isAssistant ? '⚡ المبرمج المساعد (إشراف وإصلاح)' : '💻 المبرمج العادي (تنفيذ)'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
            {canManageTasks && (
              <>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.primary,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: borderRadius.md,
                    gap: 4,
                  }}
                >
                  <Plus size={14} color="#0A0A0A" />
                  <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 11 }}>مهمة جديدة</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowQuickFixModal(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F59E0B',
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: borderRadius.md,
                    gap: 4,
                  }}
                >
                  <Zap size={14} color="#0A0A0A" />
                  <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 11 }}>إصلاح سريع ⚡</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={fetchTasks}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: borderRadius.md,
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>تحديث 🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}\n      {/* Quick Links: Code Snippets & Dev Secret Chat */}
      <View
        style={{
          flexDirection: 'row-reverse',
          padding: spacing.md,
          backgroundColor: '#111111',
          borderBottomWidth: 1,
          borderBottomColor: '#222',
          gap: spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('CodeSnippets')}
          style={{
            flex: 1,
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1A1A1A',
            borderWidth: 1,
            borderColor: '#333',
            paddingVertical: 8,
            borderRadius: borderRadius.md,
            gap: 6,
          }}
        >
          <Code size={16} color={colors.primary} />
          <Text style={{ color: colors.white, fontSize: 12, fontWeight: 'bold' }}>مكتبة الأكواد 💻</Text>
        </TouchableOpacity>

        {isOwner ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminReports')}
            style={{
              flex: 1,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1A1A1A',
              borderWidth: 1,
              borderColor: colors.primary,
              paddingVertical: 8,
              borderRadius: borderRadius.md,
              gap: 6,
            }}
          >
            <BarChart2 size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>تقارير الإنجاز البرمجي 📊</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.navigate('DevChat')}
            style={{
              flex: 1,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1A1A1A',
              borderWidth: 1,
              borderColor: '#333',
              paddingVertical: 8,
              borderRadius: borderRadius.md,
              gap: 6,
            }}
          >
            <MessageSquare size={16} color="#3B82F6" />
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: 'bold' }}>شات المطورين السري 💬</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Switcher */}
      <View
        style={{
          flexDirection: 'row-reverse',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: '#141416',
          borderBottomWidth: 1,
          borderBottomColor: '#27272A',
          gap: spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('tasks')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: borderRadius.md,
            backgroundColor: activeTab === 'tasks' ? colors.primary : '#1F1F23',
            alignItems: 'center',
            flexDirection: 'row-reverse',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Code size={16} color={activeTab === 'tasks' ? '#0A0A0A' : colors.gray} />
          <Text
            style={{
              color: activeTab === 'tasks' ? '#0A0A0A' : colors.gray,
              fontWeight: '900',
              fontSize: 13,
            }}
          >
            مهام التطوير (Kanban) 📋
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('team')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: borderRadius.md,
            backgroundColor: activeTab === 'team' ? colors.primary : '#1F1F23',
            alignItems: 'center',
            flexDirection: 'row-reverse',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Users size={16} color={activeTab === 'team' ? '#0A0A0A' : colors.gray} />
          <Text
            style={{
              color: activeTab === 'team' ? '#0A0A0A' : colors.gray,
              fontWeight: '900',
              fontSize: 13,
            }}
          >
            فريق المبرمجين والرتب 👥
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'team' ? (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
          refreshControl={
            <RefreshControl
              refreshing={loadingTeam}
              onRefresh={fetchDevTeam}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Team Structure Info Banner */}
          <Card style={{ marginBottom: spacing.md, borderColor: colors.primary, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: spacing.xs }}>
              <Crown size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16 }}>
                هيكل ورتب الفريق البرمجي
              </Text>
            </View>
            <Text style={{ color: colors.gray, fontSize: 13, lineHeight: 20, textAlign: 'right' }}>
              • <Text style={{ color: colors.primary, fontWeight: 'bold' }}>القائد العام (Lead Developer):</Text> الدعم التقني والبرمجي (صلاحيات كاملة، إنشاء حسابات، ترقية المبرمجين).
              {'\n'}• <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>مبرمج مساعد (Assistant):</Text> مراجعة الكود، متابعة المهام وتوزيعها.
              {'\n'}• <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>مبرمج مبتدئ (Junior):</Text> الرتبة المبدئية لأي مبرمج جديد ينضم للفريق حتى يتم تقييمه.
            </Text>
          </Card>

          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>
              أعضاء الفريق البرمجي ({devTeam.length})
            </Text>
            <TouchableOpacity onPress={fetchDevTeam} style={{ padding: 6, backgroundColor: '#222', borderRadius: borderRadius.sm }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>تحديث 🔄</Text>
            </TouchableOpacity>
          </View>

          {loadingTeam ? (
            <Loading message="جاري جلب أعضاء الفريق البرمجي..." />
          ) : devTeam.length === 0 ? (
            <Text style={{ color: colors.gray, textAlign: 'center', paddingVertical: spacing.xl }}>
              لم يتم العثور على مبرمجين مسجلين حالياً
            </Text>
          ) : (
            devTeam.map((member: any) => {
              const rank = member.developer_rank || member.developerRank || 'junior';
              const isMemberLead = rank === 'lead' || member.developerRank === 'lead' || member.programmerLevel === 'lead';
              const isMemberAssistant = rank === 'assistant';
              const isMemberJunior = !isMemberLead && !isMemberAssistant;

              return (
                <Card key={member.id} style={{ marginBottom: spacing.sm, borderColor: isMemberLead ? colors.primary : '#27272A' }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: isMemberLead ? 'rgba(212,175,55,0.15)' : '#1F1F23',
                          borderWidth: 1,
                          borderColor: isMemberLead ? colors.primary : '#333',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isMemberLead ? (
                          <Crown size={20} color={colors.primary} />
                        ) : isMemberAssistant ? (
                          <Zap size={20} color="#F59E0B" />
                        ) : (
                          <Code size={20} color="#3B82F6" />
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15 }}>
                          {member.name}
                        </Text>
                        <Text style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}>
                          📱 {member.phone} {member.email ? `| ✉️ ${member.email}` : ''}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-start' }}>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: borderRadius.sm,
                          backgroundColor: isMemberLead
                            ? 'rgba(212,175,55,0.2)'
                            : isMemberAssistant
                            ? 'rgba(245,158,11,0.2)'
                            : 'rgba(59,130,246,0.2)',
                          borderWidth: 1,
                          borderColor: isMemberLead ? colors.primary : isMemberAssistant ? '#F59E0B' : '#3B82F6',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '900',
                            color: isMemberLead ? colors.primary : isMemberAssistant ? '#F59E0B' : '#3B82F6',
                          }}
                        >
                          {isMemberLead ? '👑 قائد الفريق (Lead)' : isMemberAssistant ? '⚡ مبرمج مساعد (Assistant)' : '💻 مبرمج مبتدئ (Junior)'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions for Lead Maher */}
                  {isLead && isMemberJunior && (
                    <View style={{ marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#27272A', flexDirection: 'row-reverse', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => handlePromoteDev(member.id)}
                        style={{
                          backgroundColor: colors.primary,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: borderRadius.md,
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Zap size={14} color="#0A0A0A" />
                        <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 12 }}>
                          ترقية إلى مبرمج مساعد ⚡
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>
      ) : (
        /* ===== Kanban Board ===== */
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchTasks}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* عمود المهام الجديدة */}
          <Text style={{ color: colors.info, fontWeight: '900', fontSize: typography.sizes.lg, textAlign: 'right', marginBottom: spacing.sm }}>
            🆕 جديدة ({newTasks.length})
          </Text>
          {newTasks.map(task => (
            <TaskCard key={task.id} task={task} isLead={isLead} canManage={canManageTasks}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
          {newTasks.length === 0 && (
            <Text style={{ color: colors.gray, textAlign: 'center', paddingVertical: spacing.md }}>لا توجد مهام جديدة</Text>
          )}

          {/* عمود قيد التطوير */}
          <Text style={{ color: colors.warning, fontWeight: '900', fontSize: typography.sizes.lg, textAlign: 'right', marginTop: spacing.lg, marginBottom: spacing.sm }}>
            ⏳ قيد التطوير ({inProgressTasks.length})
          </Text>
          {inProgressTasks.map(task => (
            <TaskCard key={task.id} task={task} isLead={isLead} canManage={canManageTasks}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
          {inProgressTasks.length === 0 && (
            <Text style={{ color: colors.gray, textAlign: 'center', paddingVertical: spacing.md }}>لا توجد مهام قيد التطوير</Text>
          )}

          {/* عمود تحت المراجعة */}
          <Text style={{ color: colors.purple, fontWeight: '900', fontSize: typography.sizes.lg, textAlign: 'right', marginTop: spacing.lg, marginBottom: spacing.sm }}>
            👀 تحت المراجعة ({reviewTasks.length})
          </Text>
          {reviewTasks.map(task => (
            <TaskCard key={task.id} task={task} isLead={isLead} canManage={canManageTasks}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
          {reviewTasks.length === 0 && (
            <Text style={{ color: colors.gray, textAlign: 'center', paddingVertical: spacing.md }}>لا توجد مهام تحت المراجعة</Text>
          )}

          {/* عمود مكتملة */}
          <Text style={{ color: colors.success, fontWeight: '900', fontSize: typography.sizes.lg, textAlign: 'right', marginTop: spacing.lg, marginBottom: spacing.sm }}>
            ✅ مكتملة ({doneTasks.length})
          </Text>
          {doneTasks.map(task => (
            <TaskCard key={task.id} task={task} isLead={isLead} canManage={canManageTasks}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
          {doneTasks.length === 0 && (
            <Text style={{ color: colors.gray, textAlign: 'center', paddingVertical: spacing.md }}>لا توجد مهام مكتملة</Text>
          )}
        </ScrollView>
      )}

      {/* ===== مودال إنشاء مهمة ===== */}
      <CreateTaskModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
        devTeam={devTeam}
      />

      {/* ===== مودال الإصلاح السريع للأخطاء (خاص بالمبرمج المساعد) ===== */}
      <QuickFixModal
        visible={showQuickFixModal}
        onClose={() => setShowQuickFixModal(false)}
        onSubmit={handleQuickFix}
      />

      {/* ===== مودال ميثاق وقوانين المبرمجين (الوصايا العشر) ===== */}
      <Modal visible={showOnboardingModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '90%',
              backgroundColor: '#121214',
              borderRadius: borderRadius.xl,
              borderWidth: 1.5,
              borderColor: '#8B5CF6',
              padding: spacing.xl,
            }}
          >
            <Text style={{ color: '#8B5CF6', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 4 }}>
              ميثاق وقوانين المبرمجين في TecnoRexa 📜💻
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center', marginBottom: spacing.md }}>
              الوصايا الهندسية العشر لقيادة المنصة بإشراف الدعم التقني والبرمجي
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360, marginVertical: 8 }}>
              {[
                { num: '١', title: 'لا بيانات وهمية (Zero Mock Data)', desc: 'كل رقم أو نص في الشاشات مصدره استعلام حقيقي 100% من قاعدة البيانات.' },
                { num: '٢', title: 'لا أرقام ثابتة (Zero Hardcoded Numbers)', desc: 'غياب البيانات يُعرض كـ 0 أو قائمة فارغة، ويمنع وضع أرقام تخيلية.' },
                { num: '٣', title: 'لا مصطلحات تقنية للمستخدم (Zero Jargon)', desc: 'رسائل النظام بلغة عربية راقية ومهنية خالية من الأخطاء الداخلية.' },
                { num: '٤', title: 'السرية والأمان التام', desc: 'حماية بيانات العملاء والمستخدمين وعدم كشف أي مفاتيح برمجية أو روابط داخلية.' },
                { num: '٥', title: 'خلو الكود من الأخطاء (Zero TypeScript Errors)', desc: 'فحص دوري لكل الشاشات والملفات لضمان جودة الاستقرار البرمجي.' },
                { num: '٦', title: 'توسيط كافة النوافذ (Centered Modals)', desc: 'الالتزام بتوسيط كل النوافذ المنبثقة رأسياً وأفقياً على مختلف مقاسات الشاشات.' },
                { num: '٧', title: 'المرونة والتراجع الهادئ (Silent Fallback)', desc: 'استمرار التطبيق في العمل بدون انهيار مهما تعثرت شبكة أو اتصال سحابي.' },
                { num: '٨', title: 'منع تكرار الواجهات عبر الرتب السبع', desc: 'كل رتبة لها تجربة مستخدم مخصصة تعكس وظيفتها بدقة تامة.' },
                { num: '٩', title: 'الهوية الفاخرة (أسود #0A0A0A وذهبي #D4AF37)', desc: 'التزام حرفي بنظام الألوان والتصميم الفخم لكل مكون وزر وبطاقة.' },
                { num: '١٠', title: 'روح الفريق والقيادة الهندسية', desc: 'التنسيق المستمر مع الدعم التقني والبرمجي (قائد التطوير) وإدارة المنصة.' },
              ].map((law) => (
                <View
                  key={law.num}
                  style={{
                    flexDirection: 'row-reverse',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 10,
                    backgroundColor: '#18181B',
                    padding: 10,
                    borderRadius: borderRadius.md,
                    borderWidth: 1,
                    borderColor: '#27272A',
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#8B5CF6', fontWeight: '900', fontSize: 13 }}>{law.num}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13, textAlign: 'right' }}>
                      {law.title}
                    </Text>
                    <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right', marginTop: 2, lineHeight: 16 }}>
                      {law.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={handleAgreeOnboarding}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#8B5CF6',
                paddingVertical: spacing.md,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                marginTop: spacing.md,
              }}
            >
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 14 }}>
                أوافق وأتعهد بالالتزام التام بالمعايير 📜
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
