import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Wallet,
  MapPin,
  CheckCircle2,
  ShoppingBag,
  ShieldCheck,
  Truck,
} from 'lucide-react-native';
import { fetchApi } from '../../api/client';
import { useCartStore } from '../../store/cartStore';
import { colors, spacing, typography, borderRadius } from '../../theme';

export default function CartScreen({ navigation }: any) {
  const {
    items: storeItems,
    updateQuantity: storeUpdateQty,
    removeItem: storeRemoveItem,
    clearCart,
  } = useCartStore();

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet'>('cod');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Real items from store
  const items = storeItems;

  useEffect(() => {
    fetchApi('/user/balance')
      .then((res) => setWalletBalance(res?.balance ?? 0))
      .catch(() => {
        fetchApi('/wallet')
          .then((res) => setWalletBalance(res?.balance ?? 0))
          .catch(() => setWalletBalance(0));
      });
  }, []);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = items.length > 0 ? 50 : 0;
  const grandTotal = total + shipping;

  const updateQuantity = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        storeRemoveItem(id);
      } else {
        storeUpdateQty(id, newQty);
      }
    }
  };

  const removeItem = (id: string) => {
    storeRemoveItem(id);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('تنبيه', 'السلة فارغة، يرجى إضافة منتجات أولاً');
      return;
    }
    if (!address.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة عنوان التوصيل بالتفصيل 📍');
      return;
    }

    if (paymentMethod === 'wallet' && walletBalance < grandTotal) {
      Alert.alert(
        'رصيد المحفظة غير كافٍ',
        `رصيدك الحالي (${walletBalance} ج.م) أقل من إجمالي الطلب (${grandTotal} ج.م). يرجى اختيار الدفع عند الاستلام أو شحن المحفظة.`
      );
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await fetchApi('/orders', {
        method: 'POST',
        data: {
          items,
          address: address.trim(),
          paymentMethod,
          total: grandTotal,
          type: 'marketplace',
          serviceType: 'شراء قطع غيار',
        },
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      clearCart();
      setOrderSuccess(true);
      setTimeout(() => {
        navigation.navigate('Orders');
      }, 2000);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إتمام الطلب');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (orderSuccess) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.dark,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: 'rgba(212,175,55,0.15)',
            borderWidth: 2,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <CheckCircle2 color={colors.primary} size={56} />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '900',
            color: colors.white,
            textAlign: 'center',
          }}
        >
          تم تأكيد الطلب بنجاح! 🎉
        </Text>
        <Text
          style={{
            color: colors.gray,
            fontSize: 14,
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          تم إرسال طلب الشراء للمتجر، وجاري تحويلك لصفحة تتبع الطلبات...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* Luxury Black & Gold Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: colors.darkCard,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => clearCart()}
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          }}
        >
          <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>
            تفريغ السلة
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: typography.sizes.lg,
              fontWeight: '900',
              color: colors.white,
            }}
          >
            سلة المشتريات 🛍️
          </Text>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
            {items.length} منتجات في السلة
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else if (navigation?.navigate) {
              navigation.navigate('Marketplace');
            }
          }}
          style={{
            width: 40,
            height: 40,
            backgroundColor: '#1E1E1E',
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight color={colors.white} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: 160,
        }}
      >
        {/* Cart Items List */}
        {items.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.xl,
              padding: spacing.xxl,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: colors.border,
              borderStyle: 'dashed',
              marginVertical: spacing.xl,
            }}
          >
            <ShoppingBag color={colors.gray} size={48} style={{ marginBottom: 12 }} />
            <Text
              style={{
                color: colors.white,
                fontWeight: '900',
                fontSize: 16,
                marginBottom: 6,
              }}
            >
              سلة المشتريات فارغة
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}>
              تصفح سوق قطع الغيار واختر ما يلزمك لصيانة أجهزتك
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Marketplace')}
              style={{
                marginTop: spacing.lg,
                backgroundColor: colors.primary,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
              }}
            >
              <Text
                style={{
                  color: colors.dark,
                  fontWeight: '900',
                  fontSize: 13,
                }}
              >
                تصفح السوق الآن 🛒
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                color: colors.white,
                fontWeight: '900',
                fontSize: typography.sizes.md,
                textAlign: 'right',
                marginBottom: spacing.sm,
              }}
            >
              القطع المختارة
            </Text>

            {items.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  style={{
                    padding: spacing.xs,
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    borderRadius: borderRadius.sm,
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.3)',
                  }}
                >
                  <Trash2 color={colors.danger} size={18} />
                </TouchableOpacity>

                <View
                  style={{
                    flex: 1,
                    alignItems: 'flex-end',
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontWeight: '800',
                      fontSize: 13,
                      textAlign: 'right',
                    }}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: '900',
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString()} ج.م
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>
                    سعر القطعة: {(Number(item.price) || 0).toLocaleString()} ج.م
                  </Text>

                  {/* Quantity Counter */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 8,
                      backgroundColor: '#0A0A0A',
                      borderRadius: borderRadius.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                      overflow: 'hidden',
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, -1)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        backgroundColor: '#1C1C1C',
                      }}
                    >
                      <Minus size={12} color={colors.white} />
                    </TouchableOpacity>

                    <Text
                      style={{
                        paddingHorizontal: 10,
                        fontWeight: '900',
                        color: colors.primary,
                        fontSize: 12,
                      }}
                    >
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, 1)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        backgroundColor: '#1C1C1C',
                      }}
                    >
                      <Plus size={12} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>

                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: borderRadius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: '#1C1C1C',
                      borderRadius: borderRadius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingBag size={24} color={colors.gray} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Delivery Address */}
        <View style={{ marginBottom: spacing.lg }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 6,
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={{
                fontWeight: '900',
                color: colors.white,
                fontSize: 14,
              }}
            >
              عنوان التوصيل
            </Text>
            <MapPin size={16} color={colors.primary} />
          </View>

          <View
            style={{
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <TextInput
              style={{
                backgroundColor: '#0A0A0A',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                textAlign: 'right',
                color: colors.white,
                height: 70,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 13,
              }}
              placeholder="اكتب العنوان بالتفصيل (المدينة، الحي، اسم الشارع، رقم العمارة)..."
              placeholderTextColor={colors.gray}
              multiline
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        {/* Payment Methods */}
        <View style={{ marginBottom: spacing.lg }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 6,
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={{
                fontWeight: '900',
                color: colors.white,
                fontSize: 14,
              }}
            >
              طريقة الدفع
            </Text>
            <CreditCard size={16} color={colors.primary} />
          </View>

          <View style={{ gap: spacing.sm }}>
            {/* COD Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('cod')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.darkCard,
                padding: spacing.md,
                borderRadius: borderRadius.lg,
                borderWidth: 1.5,
                borderColor:
                  paymentMethod === 'cod' ? colors.primary : colors.border,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor:
                    paymentMethod === 'cod' ? colors.primary : colors.gray,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {paymentMethod === 'cod' && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: spacing.md }}>
                <Text
                  style={{
                    color: colors.white,
                    fontWeight: '800',
                    fontSize: 14,
                  }}
                >
                  الدفع عند الاستلام (COD) 💵
                </Text>
                <Text
                  style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}
                >
                  ادفع نقداً لمندوب الشحن فور فحص واستلام الشحنة
                </Text>
              </View>

              <Truck color={colors.primary} size={22} />
            </TouchableOpacity>

            {/* Wallet Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('wallet')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.darkCard,
                padding: spacing.md,
                borderRadius: borderRadius.lg,
                borderWidth: 1.5,
                borderColor:
                  paymentMethod === 'wallet' ? colors.primary : colors.border,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor:
                    paymentMethod === 'wallet' ? colors.primary : colors.gray,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {paymentMethod === 'wallet' && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: spacing.md }}>
                <Text
                  style={{
                    color: colors.white,
                    fontWeight: '800',
                    fontSize: 14,
                  }}
                >
                  محفظة TecnoRexa 💳
                </Text>
                <Text
                  style={{
                    color: '#10B981',
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: 2,
                  }}
                >
                  رصيدك المتاح: {walletBalance.toLocaleString()} ج.م
                </Text>
              </View>

              <Wallet color={colors.primary} size={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Invoice Summary */}
        <View
          style={{
            backgroundColor: colors.darkCard,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: spacing.xs,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '800' }}>
              {total.toLocaleString()} ج.م
            </Text>
            <Text style={{ color: colors.gray }}>إجمالي قطع الغيار</Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: spacing.xs,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '800' }}>
              {shipping.toLocaleString()} ج.م
            </Text>
            <Text style={{ color: colors.gray }}>مصاريف الشحن والتوصيل</Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: spacing.sm,
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontWeight: '900',
                fontSize: 20,
              }}
            >
              {grandTotal.toLocaleString()} ج.م
            </Text>
            <Text
              style={{
                color: colors.white,
                fontWeight: '900',
                fontSize: 16,
              }}
            >
              الإجمالي الكلي
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Checkout Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.darkCard,
          padding: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={isCheckingOut || items.length === 0}
          style={{
            backgroundColor: items.length === 0 ? colors.border : colors.primary,
            borderRadius: borderRadius.lg,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isCheckingOut ? (
            <ActivityIndicator color={colors.dark} />
          ) : (
            <Text
              style={{
                color: colors.dark,
                fontWeight: '900',
                fontSize: 16,
              }}
            >
              تأكيد وإرسال الطلب ({grandTotal.toLocaleString()} ج.م) 🚀
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
