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
} from 'react-native';
import {
  Code,
  Search,
  Plus,
  Copy,
  Trash2,
  Edit3,
  CheckCircle,
  X,
  User,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card, Button, Input, Loading } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { fetchApi } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';
import { Clipboard } from 'react-native';

// ===== أنواع البيانات =====
interface Snippet {
  id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  authorId: string;
  authorName: string;
  likes: number;
  createdAt: string;
}

const LANGUAGES = [
  { id: 'all', label: 'الكل' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'sql', label: 'SQL' },
  { id: 'react_native', label: 'React Native' },
  { id: 'csharp', label: 'C#' },
];

// ===== مكون المقتطف =====
const SnippetItem = ({
  snippet,
  isLead,
  currentUser,
  onDelete,
  onCopy,
}: {
  snippet: Snippet;
  isLead: boolean;
  currentUser: string;
  onDelete: (id: string) => void;
  onCopy: (code: string) => void;
}) => {
  const isAuthor = snippet.authorName === currentUser || currentUser.includes(snippet.authorName);

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(isLead || isAuthor) && (
            <TouchableOpacity onPress={() => onDelete(snippet.id)}>
              <Trash2 color={colors.danger} size={18} />
            </TouchableOpacity>
          )}
          <Text style={{ backgroundColor: colors.dark, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, color: colors.primary, fontSize: typography.sizes.xs, fontWeight: '700' }}>
            {snippet.language}
          </Text>
        </View>
        <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>#{snippet.id}</Text>
      </View>

      <Text style={{ color: colors.white, fontWeight: '900', fontSize: typography.sizes.md, textAlign: 'right', marginTop: spacing.xs }}>
        {snippet.title}
      </Text>
      <Text style={{ color: colors.gray, fontSize: typography.sizes.sm, textAlign: 'right', marginTop: 4 }}>
        {snippet.description}
      </Text>

      {/* الكود */}
      <View style={{ backgroundColor: colors.dark, borderRadius: borderRadius.md, padding: spacing.md, marginVertical: spacing.sm }}>
        <Text style={{ color: colors.primary, fontFamily: 'monospace', fontSize: typography.sizes.sm, textAlign: 'left' }} numberOfLines={4}>
          {snippet.code}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity onPress={() => onCopy(snippet.code)} style={{ backgroundColor: colors.dark, padding: spacing.sm, borderRadius: borderRadius.sm }}>
            <Copy color={colors.primary} size={18} />
          </TouchableOpacity>
          <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>❤️ {snippet.likes}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <User color={colors.gray} size={14} />
          <Text style={{ color: colors.white, fontSize: typography.sizes.xs }}>{snippet.authorName}</Text>
        </View>
      </View>
    </Card>
  );
};

// ===== مودال إضافة مقتطف =====
const AddSnippetModal = ({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !code.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال عنوان الكود ونصه');
      return;
    }
    onSubmit({ title, description, language, code });
    setTitle('');
    setDescription('');
    setLanguage('javascript');
    setCode('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg }}>
        <View style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.xl, padding: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.gray} size={24} />
            </TouchableOpacity>
            <Text style={{ color: colors.white, fontSize: typography.sizes.xl, fontWeight: '900' }}>إضافة كود جديد 📚</Text>
          </View>

          <Input label="عنوان الكود" value={title} onChangeText={setTitle} />
          <Input label="الوصف" value={description} onChangeText={setDescription} multiline numberOfLines={2} />

          <Text style={{ color: colors.white, fontWeight: '700', textAlign: 'right', marginBottom: spacing.xs }}>اللغة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {LANGUAGES.filter(l => l.id !== 'all').map(l => (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => setLanguage(l.id)}
                  style={{ paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.sm, backgroundColor: language === l.id ? colors.primary : colors.dark }}
                >
                  <Text style={{ color: language === l.id ? colors.dark : colors.white, fontWeight: '700' }}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Input label="نص الكود" value={code} onChangeText={setCode} multiline numberOfLines={5} style={{ minHeight: 100 }} />

          <Button title="حفظ الكود" onPress={handleSubmit} variant="primary" fullWidth />
        </View>
      </View>
    </Modal>
  );
};

// ===== الشاشة الرئيسية =====
export default function CodeSnippetsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const isLead = user?.developerRank === 'lead' || user?.role === 'owner';
  const currentUser = user?.name || '';

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/dev/snippets');
      setSnippets(data || []);
    } catch (error) {
      setSnippets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const filteredSnippets = snippets.filter(s => {
    const matchSearch = s.title.includes(search) || s.description.includes(search);
    const matchLanguage = languageFilter === 'all' || s.language === languageFilter;
    return matchSearch && matchLanguage;
  });

  const handleDelete = async (id: string) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا الكود؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetchApi(`/dev/snippets/${id}`, { method: 'DELETE' });
            setSnippets(prev => prev.filter(s => s.id !== id));
            Alert.alert('تم الحذف', 'تم حذف المقتطف');
          } catch (error) {
            Alert.alert('خطأ', 'فشل الحذف');
          }
        },
      },
    ]);
  };

  const handleCopy = (code: string) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(code);
      } else if (Clipboard && Clipboard.setString) {
        Clipboard.setString(code);
      }
      Alert.alert('تم النسخ', 'تم نسخ الكود إلى الحافظة بنجاح');
    } catch {
      Alert.alert('تم النسخ', 'تم نسخ الكود');
    }
  };

  const handleAdd = async (data: any) => {
    try {
      const newSnippet = await fetchApi('/dev/snippets', { method: 'POST', data });
      setSnippets([newSnippet, ...snippets]);
      Alert.alert('تم الإضافة', 'تم حفظ الكود في المكتبة');
    } catch (error) {
      Alert.alert('خطأ', 'فشل إضافة الكود');
    }
  };

  if (loading) {
    return <Loading message="جاري تحميل المكتبة..." fullScreen />;
  }

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* ☰ Owner Header with Drawer navigation & back */}
      <OwnerHeader
        title="مكتبة الأكواد"
        subtitle="مكتبة الأكواد المشتركة والمقتطفات البرمجية"
        navigation={navigation}
        currentScreen="CodeSnippets"
        showBack
        onRefresh={fetchSnippets}
        rightAction={
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: borderRadius.md,
              gap: 4,
            }}
          >
            <Plus size={16} color="#0A0A0A" />
            <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 12 }}>كود جديد</Text>
          </TouchableOpacity>
        }
      />

      <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>

        {/* البحث */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginTop: spacing.md }}>
          <Search color={colors.gray} size={20} />
          <TextInput
            style={{ flex: 1, padding: spacing.sm, color: colors.white, textAlign: 'right' }}
            placeholder="بحث في الأكواد..."
            placeholderTextColor={colors.gray}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* فلاتر اللغة */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.id}
                onPress={() => setLanguageFilter(l.id)}
                style={{ paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.sm, backgroundColor: languageFilter === l.id ? colors.primary : colors.darkCard }}
              >
                <Text style={{ color: languageFilter === l.id ? colors.dark : colors.white, fontWeight: '700', fontSize: typography.sizes.xs }}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ===== قائمة المقتطفات ===== */}
      <FlatList
        data={filteredSnippets}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        renderItem={({ item }) => (
          <SnippetItem
            snippet={item}
            isLead={isLead}
            currentUser={currentUser}
            onDelete={handleDelete}
            onCopy={handleCopy}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Code color={colors.gray} size={48} />
            <Text style={{ color: colors.gray, fontSize: typography.sizes.lg, marginTop: spacing.md }}>لا توجد مقتطفات</Text>
          </View>
        }
      />

      {/* ===== مودال إضافة ===== */}
      <AddSnippetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAdd}
      />
    </SafeAreaView>
  );
}
