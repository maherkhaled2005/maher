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
  Package,
  MapPin,
  Search,
  Plus,
  Trash2,
  Edit3,
  X,
  Building2,
  Boxes,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';
import { useAuthStore } from '../../store/authStore';

interface WarehouseItem {
  id: string;
  name: string;
  location: string;
  isDefault?: number | boolean;
  createdAt?: string;
  itemsCount?: number;
  totalStock?: number;
}

interface StockMovementItem {
  id: string;
  productId: string;
  productName?: string;
  type: string;
  quantity: number;
  reason?: string;
  createdAt: string;
}

export default function WarehousesScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const canManageWarehouses = user?.role === 'owner' || user?.role === 'manager';

  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [movements, setMovements] = useState<StockMovementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Tabs: 'warehouses' | 'movements'
  const [activeTab, setActiveTab] = useState<'warehouses' | 'movements'>('warehouses');

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);

  // Stock Inventory Modal
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseItem | null>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Get warehouses
      const whData = await fetchApi('/warehouses');
      if (Array.isArray(whData)) {
        setWarehouses(whData);
      }

      // 2. Get stock movements
      const movData = await fetchApi('/warehouses/movements');
      if (Array.isArray(movData)) {
        setMovements(movData);
      }
    } catch (err: any) {
      console.warn('Error loading warehouses data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase())
  );

  // Open Inventory Modal
  const handleViewInventory = async (wh: WarehouseItem) => {
    setSelectedWarehouse(wh);
    setInventoryModalVisible(true);
    setLoadingInventory(true);
    try {
      const inv = await fetchApi(`/warehouses/${wh.id}/inventory`);
      setInventoryItems(Array.isArray(inv) ? inv : []);
    } catch (err: any) {
      console.warn('Could not load inventory:', err.message);
      setInventoryItems([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (wh: WarehouseItem) => {
    setEditId(wh.id);
    setFormName(wh.name);
    setFormLocation(wh.location);
    setFormIsDefault(Boolean(wh.isDefault));
    setAddModalVisible(true);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditId(null);
    setFormName('');
    setFormLocation('');
    setFormIsDefault(false);
    setAddModalVisible(true);
  };

  // Save Warehouse (Add/Edit)
  const handleSaveWarehouse = async () => {
    if (!formName.trim() || !formLocation.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المخزن وموقعه.');
      return;
    }

    try {
      if (editId) {
        await fetchApi(`/warehouses/${editId}`, {
          method: 'PUT',
          data: {
            name: formName.trim(),
            location: formLocation.trim(),
            isDefault: formIsDefault ? 1 : 0,
          },
        });
        setWarehouses(
          warehouses.map((w) =>
            w.id === editId
              ? { ...w, name: formName.trim(), location: formLocation.trim(), isDefault: formIsDefault ? 1 : 0 }
              : w
          )
        );
        Alert.alert('✅ تم التعديل', 'تم تحديث بيانات المخزن بنجاح.');
      } else {
        const newWh = {
          id: `wh_${Date.now()}`,
          name: formName.trim(),
          location: formLocation.trim(),
          isDefault: formIsDefault ? 1 : 0,
        };
        await fetchApi('/warehouses', {
          method: 'POST',
          data: newWh,
        });
        setWarehouses([newWh, ...warehouses]);
        Alert.alert('✅ تم بنجاح', 'تم إنشاء المستودع الجديد بنجاح.');
      }
      setAddModalVisible(false);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر حفظ المستودع');
    }
  };

  // Delete Warehouse
  const handleDeleteWarehouse = async (wh: WarehouseItem) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm(`هل أنت متأكد من رغبتك في حذف مستودع "${wh.name}"؟`)
      : true;
    if (!confirm) return;

    try {
      await fetchApi(`/warehouses/${wh.id}`, { method: 'DELETE' });
      setWarehouses(warehouses.filter((w) => w.id !== wh.id));
      Alert.alert('🗑️ تم الحذف', 'تم حذف المستودع بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر حذف المستودع');
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
        title="إدارة المخازن والمستودعات"
        subtitle={`جرد المستودعات (${warehouses.length} مخزن مسجل)`}
        sectionNumber={7}
        navigation={navigation}
        currentScreen="Warehouses"
        showBack
        onRefresh={loadData}
      />

      {/* Top Bar: Add Button & Search */}
      <View style={{ backgroundColor: '#111111', padding: spacing.md, borderBottomWidth: 1, borderColor: '#222' }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm }}>
          {canManageWarehouses && (
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
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 13 }}>مخزن جديد</Text>
            </TouchableOpacity>
          )}

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
              placeholder="ابحث بالاسم أو الموقع..."
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

        {/* Tabs: Warehouses List vs Stock Movements */}
        <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setActiveTab('warehouses')}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: borderRadius.sm,
              backgroundColor: activeTab === 'warehouses' ? 'rgba(212, 175, 55, 0.2)' : '#1A1A1A',
              borderWidth: 1,
              borderColor: activeTab === 'warehouses' ? colors.primary : '#333',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: activeTab === 'warehouses' ? colors.primary : colors.gray }}>
              قائمة المستودعات ({warehouses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('movements')}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: borderRadius.sm,
              backgroundColor: activeTab === 'movements' ? 'rgba(212, 175, 55, 0.2)' : '#1A1A1A',
              borderWidth: 1,
              borderColor: activeTab === 'movements' ? colors.primary : '#333',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: activeTab === 'movements' ? colors.primary : colors.gray }}>
              سجل حركات المخزون ({movements.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: spacing.sm }}>جاري تحميل بيانات المستودعات...</Text>
        </View>
      ) : activeTab === 'warehouses' ? (
        filteredWarehouses.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
            <Building2 size={48} color={colors.gray} />
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
              لا توجد مستودعات مسجلة
            </Text>
            <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              اضغط على "مخزن جديد" لإنشاء مستودع رئيسي وتوزيع البضائع
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredWarehouses}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 150 }}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: '#141414',
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: item.isDefault ? colors.primary : '#222',
                  padding: spacing.md,
                }}
              >
                {/* Header */}
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                    {item.isDefault ? (
                      <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>المخزن الافتراضي</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Actions (Managers and Owners only) */}
                  {canManageWarehouses && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => openEditModal(item)}
                        style={{ padding: 7, borderRadius: borderRadius.md, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' }}
                      >
                        <Edit3 size={15} color={colors.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteWarehouse(item)}
                        style={{ padding: 7, borderRadius: borderRadius.md, backgroundColor: 'rgba(220, 38, 38, 0.15)', borderWidth: 1, borderColor: '#DC2626' }}
                      >
                        <Trash2 size={15} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Location */}
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginBottom: spacing.md }}>
                  <MapPin size={13} color={colors.primary} />
                  <Text style={{ color: colors.gray, fontSize: 12 }}>{item.location}</Text>
                </View>

                {/* View Stock Button */}
                <TouchableOpacity
                  onPress={() => handleViewInventory(item)}
                  style={{
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(212, 175, 55, 0.12)',
                    borderWidth: 1,
                    borderColor: colors.primary,
                    paddingVertical: 9,
                    borderRadius: borderRadius.md,
                    gap: 6,
                  }}
                >
                  <Boxes size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>عرض جرد المخزون والمنتجات 📦</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )
      ) : (
        /* TAB 2: Stock Movement Logs */
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 150 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: '#141414',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: '#222',
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold' }}>
                  {item.productName || item.productId}
                </Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>
                  النوع: {item.type} • السبب: {item.reason || 'حركة اعتيادية'}
                </Text>
                <Text style={{ color: '#666', fontSize: 10, marginTop: 2 }}>
                  {new Date(item.createdAt).toLocaleString('ar-EG')}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-start' }}>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900' }}>
                  {item.quantity} قطعة
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL 1: Add / Edit Warehouse */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '900' }}>
                {editId ? 'تعديل المستودع' : 'إنشاء مستودع جديد'}
              </Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>اسم المخزن *</Text>
            <TextInput
              style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
              placeholder="مثال: المستودع المركزي - القاهرة"
              placeholderTextColor={colors.gray}
              value={formName}
              onChangeText={setFormName}
            />

            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>الموقع / العنوان *</Text>
            <TextInput
              style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
              placeholder="مثال: مدينة نصر - الحي السابع"
              placeholderTextColor={colors.gray}
              value={formLocation}
              onChangeText={setFormLocation}
            />

            {/* Default toggle */}
            <TouchableOpacity
              onPress={() => setFormIsDefault(!formIsDefault)}
              style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginVertical: spacing.md }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: formIsDefault ? colors.primary : '#1E1E1E',
                  borderWidth: 1,
                  borderColor: formIsDefault ? colors.primary : '#333',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {formIsDefault && <CheckCircle2 size={14} color="#0A0A0A" />}
              </View>
              <Text style={{ color: colors.white, fontSize: 13 }}>تعيين كمخزن افتراضي للمنصة</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={{ flex: 1, padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: colors.white }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveWarehouse} style={{ flex: 1, padding: 10, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>{editId ? 'حفظ التعديل' : 'إنشاء المستودع'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: View Stock Inventory */}
      <Modal visible={inventoryModalVisible} transparent animationType="slide" onRequestClose={() => setInventoryModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.sm }}>
          <View style={{ width: '100%', maxWidth: 500, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '900' }}>
                  جرد المخزون: {selectedWarehouse?.name}
                </Text>
                <Text style={{ color: colors.gray, fontSize: 11 }}>الموقع: {selectedWarehouse?.location}</Text>
              </View>
              <TouchableOpacity onPress={() => setInventoryModalVisible(false)}>
                <X size={22} color={colors.gray} />
              </TouchableOpacity>
            </View>

            {loadingInventory ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.xl }} />
            ) : inventoryItems.length === 0 ? (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Package size={40} color={colors.gray} />
                <Text style={{ color: colors.white, marginTop: spacing.sm, fontWeight: 'bold' }}>لا يوجد مخزون مسجل حالياً</Text>
              </View>
            ) : (
              <ScrollView style={{ marginBottom: spacing.md }}>
                <View style={{ gap: spacing.xs }}>
                  {inventoryItems.map((item: any, idx: number) => {
                    const isLow = (item.quantity || 0) < 10;
                    return (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row-reverse',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: spacing.sm,
                          backgroundColor: '#1A1A1A',
                          borderRadius: borderRadius.md,
                          borderWidth: 1,
                          borderColor: isLow ? '#DC2626' : '#2A2A2A',
                        }}
                      >
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold' }}>
                            {item.productName || item.productId}
                          </Text>
                          {isLow && (
                            <Text style={{ color: '#DC2626', fontSize: 10, fontWeight: 'bold' }}>
                              ⚠️ تنبيه: اقتراب نفاد الكمية (أقل من 10)
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: isLow ? '#DC2626' : colors.primary, fontSize: 16, fontWeight: '900' }}>
                          {item.quantity} قطعة
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <TouchableOpacity onPress={() => setInventoryModalVisible(false)} style={{ padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}>
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
