import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Search,
  Plus,
  Filter,
  Check,
  Ban,
  Edit3,
  Trash2,
  BarChart2,
  AlertTriangle,
  ShoppingBag,
  Star,
  Eye,
  ShoppingCart,
  DollarSign,
  X,
  Package,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { normalizeRole } from '../../utils/permissions';
import OwnerHeader from '../../components/OwnerHeader';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  stock?: number;
  image?: string;
  rating?: number;
  sellerId?: string;
  sellerName?: string;
  isApproved?: number; // 1 = active, 0 = pending, -1 = blocked
  createdAt?: string;
}

const STATUS_TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: '✅ نشط' },
  { key: 'pending', label: '⏳ معلق' },
  { key: 'blocked', label: '⛔ محظور' },
];

export default function MarketplaceScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role || 'customer');
  const isBuyer = role === 'customer' || role === 'technician' || role === 'merchant';
  const isManager = role === 'manager';
  const isOwner = role === 'owner';
  const isSupport = role === 'customer_support';

  const { addItem, count: cartCount } = useCartStore();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'pending' | 'blocked'>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Selected Target
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/products');
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err: any) {
      console.warn('Error loading products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, []);

  // Filter logic
  const categoriesList = ['الكل', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    // Status Filter
    if (statusTab === 'active' && p.isApproved !== 1) return false;
    if (statusTab === 'pending' && p.isApproved !== 0) return false;
    if (statusTab === 'blocked' && p.isApproved !== -1) return false;

    // Category Filter
    if (selectedCategory !== 'الكل' && p.category !== selectedCategory) return false;

    // Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSeller = p.sellerName ? p.sellerName.toLowerCase().includes(q) : false;
      const matchCat = p.category ? p.category.toLowerCase().includes(q) : false;
      if (!matchName && !matchSeller && !matchCat) return false;
    }

    return true;
  });

  // Action: Approve Product
  const handleApprove = async (product: ProductItem) => {
    try {
      await fetchApi(`/products/${product.id}/approve`, { method: 'POST' });
      setProducts(products.map((p) => (p.id === product.id ? { ...p, isApproved: 1 } : p)));
      Alert.alert('✅ تم الاعتماد', `تم نشر المنتج "${product.name}" بنجاح في السوق.`);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر اعتماد المنتج');
    }
  };

  // Action: Open Block Modal
  const openBlockModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setBlockReason('');
    setBlockModalVisible(true);
  };

  // Action: Confirm Block
  const handleConfirmBlock = async () => {
    if (!blockReason.trim()) {
      Alert.alert('تنبيه', 'يجب كتابة سبب الحظر لإشعار التاجر.');
      return;
    }
    if (!selectedProduct) return;

    try {
      await fetchApi(`/products/${selectedProduct.id}/block`, {
        method: 'POST',
        data: { reason: blockReason.trim() },
      });
      setProducts(products.map((p) => (p.id === selectedProduct.id ? { ...p, isApproved: -1 } : p)));
      setBlockModalVisible(false);
      Alert.alert('⛔ تم الحظر', 'تم حظر المنتج بنجاح وتسجيل السبب.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر حظر المنتج');
    }
  };

  // Action: Open Edit Modal
  const openEditModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setFormName(product.name);
    setFormPrice(String(product.price));
    setFormOriginalPrice(String(product.price));
    setFormCategory(product.category || 'عام');
    setFormStock(String(product.stock || 10));
    setFormDescription(product.description || '');
    setEditModalVisible(true);
  };

  // Action: Confirm Edit
  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    const newPrice = Number(formPrice);
    const origPrice = Number(formOriginalPrice);

    if (newPrice < origPrice) {
      const proceed = Platform.OS === 'web'
        ? window.confirm('تحذير: السعر الجديد أقل من السعر السابق! هل ترغب في المتابعة؟')
        : true;
      if (!proceed) return;
    }

    try {
      await fetchApi(`/products/${selectedProduct.id}`, {
        method: 'PUT',
        data: {
          name: formName.trim(),
          price: newPrice,
          category: formCategory.trim(),
          stock: Number(formStock) || 0,
          description: formDescription.trim(),
        },
      });

      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id
            ? {
                ...p,
                name: formName.trim(),
                price: newPrice,
                category: formCategory.trim(),
                stock: Number(formStock) || 0,
                description: formDescription.trim(),
              }
            : p
        )
      );
      setEditModalVisible(false);
      Alert.alert('✅ تم التعديل', 'تم تحديث بيانات المنتج بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر حفظ التعديلات');
    }
  };

  // Action: Open Delete Modal
  const openDeleteModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setConfirmDeleteText('');
    setDeleteModalVisible(true);
  };

  // Action: Confirm Delete with "تأكيد"
  const handleConfirmDelete = async () => {
    if (confirmDeleteText.trim() !== 'تأكيد') {
      Alert.alert('تنبيه', 'يرجى كتابة كلمة "تأكيد" في الحقل لحذف المنتج نهائياً.');
      return;
    }
    if (!selectedProduct) return;

    try {
      await fetchApi(`/products/${selectedProduct.id}`, { method: 'DELETE' });
      setProducts(products.filter((p) => p.id !== selectedProduct.id));
      setDeleteModalVisible(false);
      Alert.alert('🗑️ تم الحذف', 'تم حذف المنتج بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر حذف المنتج');
    }
  };

  // Action: Create New Product
  const handleCreateProduct = async () => {
    if (!formName.trim() || !formPrice.trim()) {
      Alert.alert('تنبيه', 'الاسم والسعر مطلوبان.');
      return;
    }

    try {
      const res = await fetchApi('/products', {
        method: 'POST',
        data: {
          name: formName.trim(),
          price: Number(formPrice),
          category: formCategory.trim() || 'عام',
          stock: Number(formStock) || 20,
          description: formDescription.trim(),
          image: formImage.trim() || '📦',
        },
      });

      if (res && res.product) {
        setProducts([res.product, ...products]);
      } else {
        await loadProducts();
      }
      setAddModalVisible(false);
      Alert.alert('✅ تم بنجاح', 'تمت إضافة المنتج الجديد ونشره بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إضافة المنتج');
    }
  };

  // Action: Open Stats Modal
  const openStatsModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setStatsModalVisible(true);
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* ☰ Owner Header with Drawer navigation */}
      <OwnerHeader
        title={isBuyer ? "سوق قطع الغيار المعتمدة" : isManager ? "مراجعة واعتماد منتجات السوق" : isSupport ? "دليل منتجات المنصة (استعلام)" : "السوق والرقابة على البضائع"}
        subtitle={`إجمالي المعروض: ${products.length} منتج`}
        sectionNumber={3}
        navigation={navigation}
        currentScreen="Marketplace"
        showBack
        onRefresh={loadProducts}
      />

      {/* Top Action Bar: Add Product or Cart & Search */}
      <View style={{ backgroundColor: '#111111', padding: spacing.md, borderBottomWidth: 1, borderColor: '#222' }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm }}>
          {isBuyer ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Cart')}
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
              <ShoppingCart size={18} color="#0A0A0A" />
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 13 }}>السلة ({cartCount})</Text>
            </TouchableOpacity>
          ) : isOwner ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddProduct')}
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
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 13 }}>إضافة منتج</Text>
            </TouchableOpacity>
          ) : null}

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
              placeholder="ابحث بالاسم، التاجر، التصنيف..."
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

        {/* Status Tabs: Shown only for Manager & Owner */}
        {!isBuyer && (
          <View style={{ flexDirection: 'row-reverse', gap: spacing.xs, marginBottom: spacing.xs }}>
            {STATUS_TABS.map((tab) => {
              const isSelected = statusTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setStatusTab(tab.key as any)}
                  style={{
                    flex: 1,
                    paddingVertical: 7,
                    borderRadius: borderRadius.sm,
                    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.2)' : '#1A1A1A',
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : '#333',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? '900' : '600',
                      color: isSelected ? colors.primary : colors.gray,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Categories Bar */}
        {categoriesList.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 4 }}>
            {categoriesList.map((cat: any) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: borderRadius.full,
                    backgroundColor: isSelected ? colors.primary : '#1F1F1F',
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : '#333',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#0A0A0A' : colors.gray }}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Product List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: spacing.sm }}>جاري تحميل المنتجات المعتمدة...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Package size={48} color={colors.gray} />
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
            لا توجد منتجات مطابقة
          </Text>
          <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            يمكنك إضافة منتج جديد أو تغيير خيارات البحث والتصنيف
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 150 }}
          renderItem={({ item }) => {
            const isApproved = item.isApproved === 1;
            const isBlocked = item.isApproved === -1;
            const isPending = !isApproved && !isBlocked;

            return (
              <View
                style={{
                  backgroundColor: '#141414',
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: isBlocked ? '#DC2626' : isPending ? '#F59E0B' : '#222222',
                  padding: spacing.md,
                }}
              >
                {/* Header info: image, name, status */}
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: borderRadius.md,
                      backgroundColor: '#1F1F1F',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#333',
                    }}
                  >
                    <Text style={{ fontSize: 26 }}>{item.image || '📦'}</Text>
                  </View>

                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text style={{ color: colors.white, fontSize: 15, fontWeight: 'bold' }}>{item.name}</Text>
                      {/* Status Tag */}
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          backgroundColor: isApproved
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isBlocked
                            ? 'rgba(220, 38, 38, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: isApproved ? '#10B981' : isBlocked ? '#DC2626' : '#F59E0B',
                          }}
                        >
                          {isApproved ? 'نشط بالسوق' : isBlocked ? 'محظور' : 'قيد المراجعة'}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4 }}>
                      التصنيف: {item.category || 'عام'} • المخزون: {item.stock || 0} قطعة
                    </Text>

                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                      <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900' }}>
                        {item.price} ج.م
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={{ color: colors.gray, fontSize: 11 }}>{item.rating || 5.0}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Description if any */}
                {item.description ? (
                  <Text style={{ color: '#888', fontSize: 12, marginTop: spacing.sm, textAlign: 'right' }} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Role-Specific Product Actions Row */}
                {isBuyer ? (
                  <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#1F1F1F' }}>
                    <TouchableOpacity
                      onPress={() => {
                        addItem({
                          id: String(item.id),
                          name: item.name,
                          price: Number(item.price) || 0,
                          image: item.image,
                        });
                        Alert.alert('🛒 تم بنجاح', `تمت إضافة "${item.name}" بسعر ${Number(item.price) || 0} ج.م إلى سلة مشترياتك.`);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: colors.primary,
                        paddingVertical: 9,
                        borderRadius: borderRadius.md,
                        flexDirection: 'row-reverse',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <ShoppingCart size={16} color="#0A0A0A" />
                      <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 13 }}>أضف للسلة</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('ProductDetails', { product: item })}
                      style={{
                        backgroundColor: '#1E1E1E',
                        borderWidth: 1,
                        borderColor: '#333',
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: borderRadius.md,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Eye size={16} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : isManager ? (
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#1F1F1F', gap: 6 }}>
                    {!isApproved && (
                      <TouchableOpacity
                        onPress={() => handleApprove(item)}
                        style={{ flex: 1, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: borderRadius.md, backgroundColor: '#10B981' }}
                      >
                        <Check size={14} color="#0A0A0A" />
                        <Text style={{ color: '#0A0A0A', fontSize: 11, fontWeight: '900' }}>موافقة واعتماد ✓</Text>
                      </TouchableOpacity>
                    )}
                    {!isBlocked && (
                      <TouchableOpacity
                        onPress={() => openBlockModal(item)}
                        style={{ flex: 1, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: borderRadius.md, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#EF4444' }}
                      >
                        <Ban size={14} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>حظر القطعة ⛔</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => openStatsModal(item)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1E1E1E', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#333' }}
                    >
                      <BarChart2 size={16} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                ) : isSupport ? (
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#1F1F1F' }}>
                    <Text style={{ color: colors.gray, fontSize: 11 }}>وضع الاستعلام والدعم الفني 🎧</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ProductDetails', { product: item })}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1E1E1E', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#333' }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>معاينة المواصفات</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Owner: Full Control */
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: spacing.md,
                      paddingTop: spacing.sm,
                      borderTopWidth: 1,
                      borderTopColor: '#1F1F1F',
                      gap: 6,
                    }}
                  >
                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={() => openDeleteModal(item)}
                      style={{
                        padding: 8,
                        borderRadius: borderRadius.md,
                        backgroundColor: 'rgba(220, 38, 38, 0.15)',
                        borderWidth: 1,
                        borderColor: '#DC2626',
                      }}
                      accessibilityLabel="حذف المنتج"
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>

                    {/* Stats Modal */}
                    <TouchableOpacity
                      onPress={() => openStatsModal(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderRadius: borderRadius.md,
                        backgroundColor: '#1E1E1E',
                        borderWidth: 1,
                        borderColor: '#333',
                      }}
                    >
                      <BarChart2 size={14} color="#3B82F6" />
                      <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '700' }}>إحصائيات</Text>
                    </TouchableOpacity>

                    {/* Edit Button */}
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderRadius: borderRadius.md,
                        backgroundColor: '#1E1E1E',
                        borderWidth: 1,
                        borderColor: '#333',
                      }}
                    >
                      <Edit3 size={14} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>تعديل</Text>
                    </TouchableOpacity>

                    {/* Block Button */}
                    {!isBlocked && (
                      <TouchableOpacity
                        onPress={() => openBlockModal(item)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 10,
                          paddingVertical: 7,
                          borderRadius: borderRadius.md,
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          borderWidth: 1,
                          borderColor: '#EF4444',
                        }}
                      >
                        <Ban size={14} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>حظر</Text>
                      </TouchableOpacity>
                    )}

                    {/* Approve Button */}
                    {!isApproved && (
                      <TouchableOpacity
                        onPress={() => handleApprove(item)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: borderRadius.md,
                          backgroundColor: '#10B981',
                        }}
                      >
                        <Check size={14} color="#0A0A0A" />
                        <Text style={{ color: '#0A0A0A', fontSize: 11, fontWeight: '900' }}>موافقة</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* MODAL 1: Block Product with Reason */}
      <Modal visible={blockModalVisible} transparent animationType="fade" onRequestClose={() => setBlockModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 450, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#DC2626' }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
              <AlertTriangle size={24} color="#DC2626" />
              <Text style={{ color: colors.white, fontSize: 17, fontWeight: '900' }}>حظر المنتج من السوق</Text>
            </View>

            <Text style={{ color: colors.gray, fontSize: 13, marginBottom: spacing.md, textAlign: 'right' }}>
              أنت على وشك حظر منتج: "{selectedProduct?.name}". يرجى كتابة سبب الحظر لإرسال إشعار للتاجر.
            </Text>

            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderWidth: 1,
                borderColor: '#333',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                color: colors.white,
                textAlign: 'right',
                minHeight: 80,
                textAlignVertical: 'top',
                marginBottom: spacing.lg,
              }}
              placeholder="مثال: سعر مبالغ فيه، صور غير واضحة، أو مواصفات مضللة..."
              placeholderTextColor={colors.gray}
              value={blockReason}
              onChangeText={setBlockReason}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setBlockModalVisible(false)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: '#222', alignItems: 'center' }}
              >
                <Text style={{ color: colors.white, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmBlock}
                style={{ flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: '#DC2626', alignItems: 'center' }}
              >
                <Text style={{ color: colors.white, fontWeight: '900' }}>تأكيد الحظر</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Edit Product */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <ScrollView style={{ width: '100%', maxWidth: 480, maxHeight: '90%' }}>
            <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '900' }}>تعديل بيانات المنتج</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <X size={20} color={colors.gray} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>اسم المنتج</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>السعر (ج.م)</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.primary, fontWeight: 'bold', textAlign: 'right', marginBottom: spacing.md }}
                value={formPrice}
                onChangeText={setFormPrice}
                keyboardType="numeric"
              />

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>التصنيف</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
                value={formCategory}
                onChangeText={setFormCategory}
              />

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>كمية المخزون</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
                value={formStock}
                onChangeText={setFormStock}
                keyboardType="numeric"
              />

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>الوصف</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', minHeight: 60, textAlignVertical: 'top', marginBottom: spacing.lg }}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: '#222', alignItems: 'center' }}>
                  <Text style={{ color: colors.white, fontWeight: '700' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEdit} style={{ flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' }}>
                  <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>حفظ التعديلات</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 3: Delete with "تأكيد" */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#DC2626' }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
              <Trash2 size={24} color="#DC2626" />
              <Text style={{ color: '#DC2626', fontSize: 17, fontWeight: '900' }}>حذف المنتج نهائياً</Text>
            </View>

            <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
              هل أنت متأكد من رغبتك في حذف: "{selectedProduct?.name}"؟
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: spacing.md, textAlign: 'right' }}>
              هذا الإجراء سيقوم بحذف المنتج وسجلاته نهائياً من المتجر. لتأكيد الحذف، اكتب كلمة <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>"تأكيد"</Text> في الحقل أدناه:
            </Text>

            <TextInput
              style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#DC2626', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'center', fontWeight: 'bold', marginBottom: spacing.lg }}
              placeholder='اكتب "تأكيد" هنا'
              placeholderTextColor={colors.gray}
              value={confirmDeleteText}
              onChangeText={setConfirmDeleteText}
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={{ flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: '#222', alignItems: 'center' }}>
                <Text style={{ color: colors.white, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmDelete} style={{ flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: '#DC2626', alignItems: 'center' }}>
                <Text style={{ color: colors.white, fontWeight: '900' }}>حذف نهائي</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Stats View */}
      <Modal visible={statsModalVisible} transparent animationType="fade" onRequestClose={() => setStatsModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#3B82F6' }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: '#3B82F6', fontSize: 17, fontWeight: '900' }}>إحصائيات المبيعات والأداء</Text>
              <TouchableOpacity onPress={() => setStatsModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.white, fontSize: 15, fontWeight: 'bold', textAlign: 'right', marginBottom: spacing.md }}>
              {selectedProduct?.name}
            </Text>

            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', padding: spacing.sm, backgroundColor: '#1E1E1E', borderRadius: borderRadius.md }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Eye size={16} color="#3B82F6" />
                  <Text style={{ color: colors.gray, fontSize: 13 }}>عدد المشاهدات:</Text>
                </View>
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>148 مشاهدة</Text>
              </View>

              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', padding: spacing.sm, backgroundColor: '#1E1E1E', borderRadius: borderRadius.md }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <ShoppingCart size={16} color="#F59E0B" />
                  <Text style={{ color: colors.gray, fontSize: 13 }}>مرات الإضافة للسلة:</Text>
                </View>
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>27 مرة</Text>
              </View>

              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', padding: spacing.sm, backgroundColor: '#1E1E1E', borderRadius: borderRadius.md }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Package size={16} color="#10B981" />
                  <Text style={{ color: colors.gray, fontSize: 13 }}>عمليات الشراء المكتملة:</Text>
                </View>
                <Text style={{ color: '#10B981', fontWeight: 'bold' }}>9 مبيعات</Text>
              </View>

              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', padding: spacing.sm, backgroundColor: '#1E1E1E', borderRadius: borderRadius.md }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={16} color={colors.primary} />
                  <Text style={{ color: colors.gray, fontSize: 13 }}>إجمالي الإيرادات المحققة:</Text>
                </View>
                <Text style={{ color: colors.primary, fontWeight: '900' }}>{(selectedProduct?.price || 0) * 9} ج.م</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => setStatsModalVisible(false)} style={{ paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: '#222', alignItems: 'center' }}>
              <Text style={{ color: colors.white, fontWeight: '700' }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: Add New Product */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <ScrollView style={{ width: '100%', maxWidth: 480, maxHeight: '90%' }}>
            <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '900' }}>إضافة منتج جديد للمنصة</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <X size={20} color={colors.gray} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>اسم المنتج *</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
                placeholder="مثال: كومبريسور تكييف شارب 1.5 حصان"
                placeholderTextColor={colors.gray}
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>السعر (ج.م) *</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.primary, fontWeight: 'bold', textAlign: 'right', marginBottom: spacing.md }}
                placeholder="مثال: 2800"
                placeholderTextColor={colors.gray}
                value={formPrice}
                onChangeText={setFormPrice}
                keyboardType="numeric"
              />

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>التصنيف</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
                placeholder="مثال: قطع غيار جديدة، أجهزة منزلية..."
                placeholderTextColor={colors.gray}
                value={formCategory}
                onChangeText={setFormCategory}
              />

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>الكمية المتاحة</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
                placeholder="20"
                placeholderTextColor={colors.gray}
                value={formStock}
                onChangeText={setFormStock}
                keyboardType="numeric"
              />

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>رمز أو إيموجي المنتج</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', marginBottom: spacing.md }}
                placeholder="مثال: ❄️ أو ⚙️ أو 📺"
                placeholderTextColor={colors.gray}
                value={formImage}
                onChangeText={setFormImage}
              />

              <Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4, textAlign: 'right' }}>الوصف والمواصفات</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, color: colors.white, textAlign: 'right', minHeight: 60, textAlignVertical: 'top', marginBottom: spacing.lg }}
                placeholder="اكتب مواصفات المنتج والضمان..."
                placeholderTextColor={colors.gray}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <TouchableOpacity onPress={() => setAddModalVisible(false)} style={{ flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: '#222', alignItems: 'center' }}>
                  <Text style={{ color: colors.white, fontWeight: '700' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateProduct} style={{ flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' }}>
                  <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>إضافة المنتج الآن</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
