import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import {
  Plus,
  Trash2,
  Edit3,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Star,
  Zap,
  Package,
  X,
  Building2,
  ShoppingBag,
} from 'lucide-react-native';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';

const CATEGORIES = [
  'تكييفات وتبريد',
  'غسالات وأجهزة منزلية',
  'ثلاجات وديب فريزر',
  'شاشات وإلكترونيات',
  'قطع غيار عامة',
];

export default function MyProductsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const isMerchant = user?.role === 'merchant' || (user as any)?.canSell || user?.isPro;
  const [isSubscribed, setIsSubscribed] = useState(isMerchant);
  const [activating, setActivating] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<any[]>([]);

  // Modal State for Add / Edit
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategory, setFormCategory] = useState('تكييفات وتبريد');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formSponsored, setFormSponsored] = useState(false);

  const loadProducts = () => {
    fetchApi('/products')
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price) || 0,
            stock: Number(p.stock) || 0,
            category: p.category || 'قطع غيار عامة',
            isAvailable: p.status !== 'blocked',
            isSponsored: p.featured || false,
            hasPendingOrders: false,
            views: p.views || 0,
            status: p.status || 'active',
          }));
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      })
      .catch(() => {
        setProducts([]);
      });
  };

  useEffect(() => {
    if (isMerchant) {
      setIsSubscribed(true);
    }
    loadProducts();
  }, [user]);

  const handleActivateStore = async () => {
    setActivating(true);
    try {
      await fetchApi('/subscriptions/subscribe', {
        method: 'POST',
        body: JSON.stringify({ type: 'merchant', plan: 'pro_merchant' }),
      });
      setIsSubscribed(true);
      Alert.alert('تهانينا! تم تفعيل متجرك 🏪', 'تم سداد 100 ج.م وتفعيل متجرك بنجاح. يمكنك الآن نشر بضاعتك في السوق العام.');
    } catch (e) {
      setIsSubscribed(true);
    } finally {
      setActivating(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('');
    setFormStock('');
    setFormCategory('تكييفات وتبريد');
    setFormAvailable(true);
    setFormSponsored(false);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDesc(product.description);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormCategory(product.category);
    setFormAvailable(product.isAvailable);
    setFormSponsored(product.isSponsored);
    setShowFormModal(true);
  };

  const handleSaveProduct = async () => {
    if (!formName.trim() || formName.trim().length < 3) {
      Alert.alert('تنبيه', 'يجب ألا يقل اسم المنتج عن 3 أحرف');
      return;
    }
    if (!formPrice || Number(formPrice) <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال سعر صحيح بالجنيه');
      return;
    }
    if (!formStock || Number(formStock) < 0) {
      Alert.alert('تنبيه', 'يرجى إدخال الكمية المتوفرة بالمخزن');
      return;
    }

    if (editingProduct) {
      // Edit mode: Check price protection if pending orders exist
      if (editingProduct.hasPendingOrders && Number(formPrice) !== editingProduct.price) {
        Alert.alert(
          'تعديل السعر محظور ⚠️',
          'لا يمكن تعديل سعر المنتج لوجود طلبات معلقة قيد التنفيذ عليه من المشترين.'
        );
        return;
      }

      try {
        await fetchApi(`/products/${editingProduct.id}`, {
          method: 'PATCH',
          data: {
            name: formName,
            description: formDesc,
            price: Number(formPrice),
            stock: Number(formStock),
            category: formCategory,
            isAvailable: formAvailable,
            isSponsored: formSponsored,
          },
        });
        Alert.alert('تم التعديل ✅', 'تم تحديث بيانات المنتج ومخزونه بنجاح.');
        loadProducts();
      } catch (err: any) {
        Alert.alert('فشل التعديل', err.message || 'تعذر تحديث المنتج.');
      }
    } else {
      // Add mode - server first
      try {
        await fetchApi('/products', {
          method: 'POST',
          data: {
            name: formName,
            description: formDesc,
            price: Number(formPrice),
            stock: Number(formStock),
            category: formCategory,
          },
        });
        Alert.alert('تم نشر المنتج بنجاح 🛒', 'تمت إضافة المنتج وسيظهر للعملاء في السوق.');
        loadProducts(); // reload from server
      } catch (err: any) {
        Alert.alert('فشل نشر المنتج', err.message || 'تعذر حفظ المنتج. يرجى المحاولة مرة أخرى.');
      }
    }

    setShowFormModal(false);
  };

  const handleDeleteProduct = (product: any) => {
    if (product.hasPendingOrders) {
      Alert.alert(
        'حذف المنتج محظور ⛔',
        'لا يمكن حذف هذا المنتج لوجود طلبات معلقة عليه قيد التجهيز أو الشحن. يجب إتمام الطلبات أولاً.'
      );
      return;
    }

    Alert.alert(
      'تأكيد الحذف 🗑️',
      `هل أنت متأكد من حذف المنتج "${product.name}" نهائياً من مخزنك؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، احذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetchApi(`/products/${product.id}`, { method: 'DELETE' }).catch(() => {});
            } catch {}
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
            Alert.alert('تم الحذف', 'تم إزالة المنتج من مخزن متجرك.');
          },
        },
      ]
    );
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.dark }, ]}>
      {/* Role Header with Drawer & Back */}
      <OwnerHeader
        title="إدارة منتجاتي ومخزوني 📦"
        subtitle={`مخزن متجر: ${user?.storeName || user?.name || 'التاجر المعتمد'}`}
        navigation={navigation}
        currentScreen="MyProducts"
        showBack={true}
        rightAction={
          isSubscribed ? (
            <TouchableOpacity
              onPress={handleOpenAddModal}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: borderRadius.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus color={colors.dark} size={16} />
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 12 }}>إضافة منتج</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Search Bar */}
      {isSubscribed && (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <View
            style={{
              height: 44,
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.lg,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Search color={colors.primary} size={18} />
            <TextInput
              placeholder="ابحث في منتجات متجرك، التصنيف..."
              placeholderTextColor={colors.gray}
              value={search}
              onChangeText={setSearch}
              style={{
                flex: 1,
                textAlign: 'right',
                fontSize: 13,
                color: colors.white,
                fontWeight: '700',
                paddingRight: spacing.sm,
              }}
            />
          </View>
        </View>
      )}

      {/* Paywall Screen for non-subscribed users */}
      {!isSubscribed ? (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
          <View
            style={{
              width: 84,
              height: 84,
              backgroundColor: 'rgba(212,175,55,0.12)',
              borderRadius: 42,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Lock color={colors.primary} size={40} />
          </View>

          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.white, textAlign: 'center', marginBottom: 8 }}>
            تفعيل متجر التاجر مطلوب 🏪
          </Text>

          <Text style={{ fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 }}>
            لإضافة منتجاتك ونشرها في السوق العام وتلقي طلبات الشراء من العملاء، قم بتفعيل متجرك التجاري مقابل{' '}
            <Text style={{ fontWeight: '900', color: colors.primary }}>100 جنيه مصري فقط</Text> (اشتراك شامل كافة المميزات).
          </Text>

          <TouchableOpacity
            onPress={handleActivateStore}
            disabled={activating}
            style={{
              width: '100%',
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            {activating ? (
              <ActivityIndicator color={colors.dark} />
            ) : (
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>ادفع الآن (100 ج.م) وفعّل متجرك 🚀</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Marketplace')}
            style={{
              width: '100%',
              backgroundColor: colors.darkCard,
              paddingVertical: 14,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.gray, fontWeight: '800', fontSize: 14 }}>تصفح السوق كعميل 🛒</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Products List */
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}>
          {filteredProducts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Package size={48} color={colors.gray} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>لا توجد منتجات مطابقة</Text>
              <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4 }}>اضغط على إضافة منتج للبدء في عرض بضاعتك</Text>
            </View>
          ) : (
            filteredProducts.map((p) => (
              <View
                key={p.id}
                style={{
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.xl,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* Product Top */}
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    {p.isSponsored && (
                      <View style={{ backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.primary }}>
                        <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>ممول ⭐</Text>
                      </View>
                    )}
                    <View style={{ backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#38BDF8', fontSize: 10, fontWeight: '800' }}>{p.category}</Text>
                    </View>
                  </View>

                  <Text style={{ color: colors.gray, fontSize: 10, fontWeight: '700' }}>#{p.id}</Text>
                </View>

                {/* Title & Desc */}
                <Text style={{ fontSize: 15, fontWeight: '900', color: colors.white, textAlign: 'right', marginBottom: 4 }}>
                  {p.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.gray, textAlign: 'right', lineHeight: 18, marginBottom: 10 }}>
                  {p.description}
                </Text>

                {/* Price & Stock info */}
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: colors.dark,
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.gray, fontSize: 10 }}>سعر البيع:</Text>
                    <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900' }}>{p.price.toLocaleString()} ج.م</Text>
                  </View>

                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: colors.gray, fontSize: 10 }}>المخزون المتاح:</Text>
                    <Text style={{ color: p.stock < 5 ? '#EF4444' : colors.white, fontSize: 14, fontWeight: '900' }}>
                      {p.stock} قطعة
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={{ color: colors.gray, fontSize: 10 }}>مشاهدات السوق:</Text>
                    <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '800' }}>{p.views} 👁️</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderColor: colors.border,
                    paddingTop: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    {p.hasPendingOrders && (
                      <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '800' }}>⚠️ عليه طلبات معلقة</Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleOpenEditModal(p)}
                      style={{
                        backgroundColor: 'rgba(59,130,246,0.15)',
                        borderWidth: 1,
                        borderColor: '#3B82F6',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: borderRadius.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Edit3 color="#3B82F6" size={14} />
                      <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '800' }}>تعديل</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(p)}
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.15)',
                        borderWidth: 1,
                        borderColor: '#EF4444',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: borderRadius.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Trash2 color="#EF4444" size={14} />
                      <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '800' }}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal: Add / Edit Product */}
      <Modal visible={showFormModal} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: colors.darkCard,
              borderRadius: 28,
              padding: spacing.xl,
              maxHeight: '90%',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: colors.white }}>
                {editingProduct ? 'تعديل بيانات المنتج ✏️' : 'إضافة منتج جديد للمتجر ➕'}
              </Text>
              <TouchableOpacity onPress={() => setShowFormModal(false)}>
                <X color={colors.gray} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.gray, textAlign: 'right', marginBottom: 4 }}>
                اسم المنتج (≥ 3 حروف) *
              </Text>
              <TextInput
                placeholder="مثال: كمبروسر شارب 2.25 حصان أصلي"
                placeholderTextColor={colors.gray}
                value={formName}
                onChangeText={setFormName}
                style={{
                  backgroundColor: colors.dark,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: 12,
                  height: 42,
                  textAlign: 'right',
                  fontSize: 13,
                  color: colors.white,
                  marginBottom: 10,
                }}
              />

              {/* Description */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.gray, textAlign: 'right', marginBottom: 4 }}>
                الوصف والمواصفات الفنية *
              </Text>
              <TextInput
                placeholder="اكتب تفاصيل المنتج، الضمان، وسنة الصنع..."
                placeholderTextColor={colors.gray}
                value={formDesc}
                onChangeText={setFormDesc}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.dark,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: 10,
                  textAlign: 'right',
                  fontSize: 13,
                  color: colors.white,
                  height: 70,
                  textAlignVertical: 'top',
                  marginBottom: 10,
                }}
              />

              {/* Price & Stock */}
              <View style={{ flexDirection: 'row-reverse', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.gray, textAlign: 'right', marginBottom: 4 }}>
                    السعر (ج.م) *
                  </Text>
                  <TextInput
                    placeholder="مثال: 4200"
                    placeholderTextColor={colors.gray}
                    value={formPrice}
                    onChangeText={setFormPrice}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: colors.dark,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: 12,
                      height: 42,
                      textAlign: 'right',
                      fontSize: 13,
                      color: colors.white,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.gray, textAlign: 'right', marginBottom: 4 }}>
                    الكمية بالمخزن *
                  </Text>
                  <TextInput
                    placeholder="مثال: 10"
                    placeholderTextColor={colors.gray}
                    value={formStock}
                    onChangeText={setFormStock}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: colors.dark,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: 12,
                      height: 42,
                      textAlign: 'right',
                      fontSize: 13,
                      color: colors.white,
                    }}
                  />
                </View>
              </View>

              {/* Category Picker */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.gray, textAlign: 'right', marginBottom: 4 }}>
                التصنيف *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, flexDirection: 'row-reverse', marginBottom: 12 }}
              >
                {CATEGORIES.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setFormCategory(c)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: borderRadius.sm,
                      backgroundColor: formCategory === c ? colors.primary : colors.dark,
                      borderWidth: 1,
                      borderColor: formCategory === c ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: formCategory === c ? colors.dark : colors.gray,
                        fontSize: 11,
                        fontWeight: '800',
                      }}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Sponsored Toggle */}
              <View
                style={{
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(212,175,55,0.08)',
                  padding: 12,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: 'rgba(212,175,55,0.3)',
                  marginBottom: 14,
                }}
              >
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>
                    تمييز المنتج (منتج ممول ⭐)
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 10 }}>يظهر في صدارة نتائج البحث بالسوق</Text>
                </View>
                <Switch
                  value={formSponsored}
                  onValueChange={setFormSponsored}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveProduct}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 14 }}>
                  {editingProduct ? 'حفظ التعديلات' : 'نشر المنتج في السوق 🚀'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
