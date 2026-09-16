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
  Plus,
  Trash2,
  Edit3,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  Layers,
  Package,
  Check,
  Zap,
  Settings2,
  Cpu,
  Wrench,
  Smartphone,
  Laptop,
  Tv,
  Flame,
  Snowflake,
  Shield,
  ShoppingCart,
  Gem,
  Lightbulb,
  Radio,
  Car,
  Home,
  Box,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

interface CategoryItem {
  id: string;
  label?: string;
  name?: string;
  icon: string;
  orderIndex?: number;
  productsCount?: number;
}

const CATEGORY_ICONS_MAP: Record<string, React.ElementType> = {
  Cpu,
  Zap,
  Settings2,
  Package,
  Wrench,
  Smartphone,
  Laptop,
  Tv,
  Flame,
  Snowflake,
  Shield,
  ShoppingCart,
  Gem,
  Lightbulb,
  Radio,
  Car,
  Home,
  Box,
  Layers,
};

export const renderCategoryIcon = (icon: string, size = 22, color: string = colors.primary) => {
  if (!icon) return <Package size={size} color={color} />;
  const IconComp = CATEGORY_ICONS_MAP[icon];
  if (IconComp) {
    return <IconComp size={size} color={color} />;
  }
  return <Text style={{ fontSize: size - 2 }}>{icon}</Text>;
};

const ICON_PICKER = [
  '❄️', '🧺', '📺', '🔥', '🔧', '⚙️', '📱', '💻', '💡', '🔌',
  '🔋', '📡', '🚗', '🏠', '🧰', '🔩', '📦', '🛒', '💎', '🛡️',
  'Cpu', 'Zap', 'Settings2', 'Wrench', 'Package',
];

export default function AdminCategoriesScreen({ navigation }: any) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('📦');

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/categories');
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setCategories(sorted);
      }
    } catch (err: any) {
      console.warn('Error loading categories:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  }, []);

  // Filtered categories
  const filteredCategories = (categories || []).filter((c) =>
    (c?.label || c?.name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  // Move category Up
  const moveUp = async (catId: string) => {
    const index = categories.findIndex((c) => c.id === catId);
    if (index <= 0) return;
    const newCats = [...categories];
    const temp = newCats[index - 1];
    newCats[index - 1] = newCats[index];
    newCats[index] = temp;
    setCategories(newCats);

    // Save order
    try {
      await fetchApi('/owner/categories/reorder', {
        method: 'POST',
        data: { categoryIds: newCats.map((c) => c.id) },
      });
    } catch (err) {
      console.warn('Error saving category reorder:', err);
    }
  };

  // Move category Down
  const moveDown = async (catId: string) => {
    const index = categories.findIndex((c) => c.id === catId);
    if (index === -1 || index >= categories.length - 1) return;
    const newCats = [...categories];
    const temp = newCats[index + 1];
    newCats[index + 1] = newCats[index];
    newCats[index] = temp;
    setCategories(newCats);

    // Save order
    try {
      await fetchApi('/owner/categories/reorder', {
        method: 'POST',
        data: { categoryIds: newCats.map((c) => c.id) },
      });
    } catch (err) {
      console.warn('Error saving category reorder:', err);
    }
  };

  // Open Add/Edit Modal
  const openAddModal = () => {
    setEditId(null);
    setFormName('');
    setFormIcon('📦');
    setModalVisible(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditId(cat.id);
    setFormName(cat.label || cat.name || '');
    setFormIcon(cat.icon || '📦');
    setModalVisible(true);
  };

  // Save Add/Edit
  const handleSaveCategory = async () => {
    if (!formName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم التصنيف');
      return;
    }

    try {
      if (editId) {
        // Update
        await fetchApi(`/categories/${editId}`, {
          method: 'PUT',
          data: { label: formName.trim(), name: formName.trim(), icon: formIcon },
        });
        setCategories(
          categories.map((c) =>
            c.id === editId ? { ...c, label: formName.trim(), name: formName.trim(), icon: formIcon } : c
          )
        );
        Alert.alert('✅ تم التحديث', 'تم حفظ تعديل التصنيف بنجاح.');
      } else {
        // Create
        const newCat = {
          id: `cat_${Date.now()}`,
          label: formName.trim(),
          name: formName.trim(),
          icon: formIcon,
          orderIndex: categories.length + 1,
        };
        await fetchApi('/categories', {
          method: 'POST',
          data: newCat,
        });
        setCategories([...categories, newCat]);
        Alert.alert('✅ تم بنجاح', 'تمت إضافة التصنيف الجديد إلى هيكل المنصة.');
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر حفظ التصنيف');
    }
  };

  // Delete category
  const handleDeleteCategory = async (cat: CategoryItem) => {
    const doDelete = async () => {
      try {
        await fetchApi(`/categories/${cat.id}`, { method: 'DELETE' });
        setCategories(categories.filter((c) => c.id !== cat.id));
        Alert.alert('🗑️ تم الحذف', 'تم حذف التصنيف بنجاح.');
      } catch (err: any) {
        Alert.alert('خطأ', err.message || 'تعذر حذف التصنيف');
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm(`هل أنت متأكد من حذف تصنيف "${cat.label || cat.name}"؟ تنبيه: قد يؤثر هذا على المنتجات التابعة له.`);
      if (confirm) doDelete();
    } else {
      Alert.alert(
        'تأكيد الحذف',
        `هل أنت متأكد من حذف تصنيف "${cat.label || cat.name}"؟ تنبيه: قد يؤثر هذا على المنتجات التابعة له.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'حذف', style: 'destructive', onPress: doDelete },
        ]
      );
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
        title="إدارة الأقسام والتصنيفات"
        subtitle={`هيكل المنصة (${categories.length} تصنيف)`}
        sectionNumber={6}
        navigation={navigation}
        currentScreen="AdminCategories"
        showBack={true}
        onRefresh={loadCategories}
      />

      {/* Top Bar: Add Category & Search */}
      <View style={{ backgroundColor: '#111111', padding: spacing.md, borderBottomWidth: 1, borderColor: '#222' }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={openAddModal}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.md,
              gap: 6,
            }}
          >
            <Plus size={18} color="#0A0A0A" />
            <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 13 }}>إضافة تصنيف</Text>
          </TouchableOpacity>

          {/* Search Input */}
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
              style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, textAlign: 'right', color: colors.white, fontSize: 13 }}
              placeholder="ابحث في تصنيفات السوق والأقسام..."
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

      {/* Categories List with Up/Down reordering */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: spacing.sm }}>جاري تحميل التصنيفات...</Text>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Layers size={48} color={colors.gray} />
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
            لا توجد تصنيفات مسجلة
          </Text>
          <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            اضغط على "إضافة تصنيف" لإنشاء أول قسم في السوق والصيانة
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 150 }}
          renderItem={({ item, index }) => {
            const catName = item.label || item.name || 'تصنيف';

            return (
              <View
                style={{
                  backgroundColor: '#141414',
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: '#222',
                  padding: spacing.md,
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Category Info */}
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: borderRadius.md,
                      backgroundColor: '#1F1F1F',
                      borderWidth: 1,
                      borderColor: '#333',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {renderCategoryIcon(item.icon, 22, colors.primary)}
                  </View>

                  <View style={{ alignItems: 'flex-end', flex: 1 }}>
                    <Text style={{ color: colors.white, fontSize: 15, fontWeight: 'bold' }}>{catName}</Text>
                    <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>
                      الترتيب في التطبيق: #{index + 1}
                    </Text>
                  </View>
                </View>

                {/* Reorder and Control Buttons */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {(() => {
                    const realIndex = categories.findIndex((c) => c.id === item.id);
                    const isFirst = realIndex <= 0;
                    const isLast = realIndex === -1 || realIndex >= categories.length - 1;
                    return (
                      <>
                        {/* Move Up */}
                        <TouchableOpacity
                          onPress={() => moveUp(item.id)}
                          disabled={isFirst}
                          style={{
                            padding: 8,
                            borderRadius: borderRadius.md,
                            backgroundColor: isFirst ? '#1A1A1A' : 'rgba(212, 175, 55, 0.1)',
                            borderWidth: 1,
                            borderColor: isFirst ? '#222' : colors.primary,
                            opacity: isFirst ? 0.4 : 1,
                          }}
                          accessibilityLabel="تحريك للأعلى"
                        >
                          <ArrowUp size={14} color={isFirst ? colors.gray : colors.primary} />
                        </TouchableOpacity>

                        {/* Move Down */}
                        <TouchableOpacity
                          onPress={() => moveDown(item.id)}
                          disabled={isLast}
                          style={{
                            padding: 8,
                            borderRadius: borderRadius.md,
                            backgroundColor: isLast ? '#1A1A1A' : 'rgba(212, 175, 55, 0.1)',
                            borderWidth: 1,
                            borderColor: isLast ? '#222' : colors.primary,
                            opacity: isLast ? 0.4 : 1,
                          }}
                          accessibilityLabel="تحريك للأسفل"
                        >
                          <ArrowDown size={14} color={isLast ? colors.gray : colors.primary} />
                        </TouchableOpacity>
                      </>
                    );
                  })()}

                  {/* Edit */}
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    style={{
                      padding: 8,
                      borderRadius: borderRadius.md,
                      backgroundColor: '#1E1E1E',
                      borderWidth: 1,
                      borderColor: '#333',
                    }}
                    accessibilityLabel="تعديل التصنيف"
                  >
                    <Edit3 size={14} color={colors.primary} />
                  </TouchableOpacity>

                  {/* Delete */}
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(item)}
                    style={{
                      padding: 8,
                      borderRadius: borderRadius.md,
                      backgroundColor: 'rgba(220, 38, 38, 0.15)',
                      borderWidth: 1,
                      borderColor: '#DC2626',
                    }}
                    accessibilityLabel="حذف التصنيف"
                  >
                    <Trash2 size={14} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* MODAL: Add / Edit Category */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '900' }}>
                {editId ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>اسم التصنيف *</Text>
            <TextInput
              style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
              placeholder="مثال: غسالات وثلاجات، قطع غيار سيارات..."
              placeholderTextColor={colors.gray}
              value={formName}
              onChangeText={setFormName}
            />

            {/* Icon Picker */}
            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>اختيار أيقونة / إيموجي *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg }}>
              {ICON_PICKER.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  onPress={() => setFormIcon(ic)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.md,
                    backgroundColor: formIcon === ic ? 'rgba(212, 175, 55, 0.25)' : '#1E1E1E',
                    borderWidth: 1,
                    borderColor: formIcon === ic ? colors.primary : '#333',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View pointerEvents="none">
                    {renderCategoryIcon(ic, 18, formIcon === ic ? colors.primary : colors.white)}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: colors.white }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveCategory} style={{ flex: 1, padding: 10, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>{editId ? 'حفظ التعديل' : 'إضافة التصنيف'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
