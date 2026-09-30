import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Package, CheckCircle, Truck, XCircle, Clock, ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface SparePartOrder {
  id: string;
  serviceRequestId: string;
  technicianId: string;
  productName: string;
  quantity: number;
  price: number;
  discountPercentage?: number;
  finalPrice: number;
  status: OrderStatus;
  createdAt: string;
}

type FilterTab = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered';

export const MerchantOrdersScreen = () => {
  const [orders, setOrders] = useState<SparePartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { user } = useAuthStore();

  const fetchOrders = async () => {
    try {
      // API call to get service requests/orders for merchant
      const response = await api.get('/api/service-requests');
      const data = response.data;
      const ordersList = Array.isArray(data) ? data : data?.data || data?.orders || [];
      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء جلب الطلبات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.patch(`/api/spare-part-orders/${orderId}/status`, { status: newStatus });
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      Alert.alert('نجاح', 'تم تحديث حالة الطلب بنجاح');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب.');
    }
  };

  const getStatusDisplay = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return { label: 'معلق', color: '#F59E0B', icon: Clock };
      case 'confirmed': return { label: 'مؤكد', color: '#3B82F6', icon: CheckCircle };
      case 'shipped': return { label: 'تم الشحن', color: '#8B5CF6', icon: Truck };
      case 'delivered': return { label: 'تم التسليم', color: '#10B981', icon: Package };
      case 'cancelled': return { label: 'ملغي', color: '#EF4444', icon: XCircle };
      default: return { label: status, color: colors.text.secondary, icon: Package };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA') + ' ' + date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    return order.status === activeFilter;
  });

  const renderFilterTab = (filter: FilterTab, label: string) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        style={[styles.filterTab, isActive && styles.activeFilterTab]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderOrderItem = ({ item }: { item: SparePartOrder }) => {
    const statusInfo = getStatusDisplay(item.status);
    const StatusIcon = statusInfo.icon;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.statusContainer}>
            <StatusIcon size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.productName}>{item.productName || 'قطعة غيار'}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>الكمية:</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>
          {item.discountPercentage ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>الخصم:</Text>
              <Text style={styles.detailValue}>{item.discountPercentage}%</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>السعر النهائي:</Text>
            <Text style={[styles.detailValue, styles.priceValue]}>{item.finalPrice} ريال</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>بواسطة:</Text>
            <Text style={styles.detailValue}>فني</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {item.status === 'pending' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => updateOrderStatus(item.id, 'confirmed')}
            >
              <CheckCircle size={20} color={colors.background.primary} />
              <Text style={styles.actionButtonText}>تأكيد الطلب</Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'confirmed' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => updateOrderStatus(item.id, 'shipped')}
            >
              <Truck size={20} color={colors.background.primary} />
              <Text style={styles.actionButtonText}>إرسال</Text>
            </TouchableOpacity>
          )}

          {item.status === 'shipped' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => updateOrderStatus(item.id, 'delivered')}
            >
              <Package size={20} color={colors.background.primary} />
              <Text style={styles.actionButtonText}>تم التسليم</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.headerTitle}>طلبات قطع الغيار</Text>
      
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: 'معلق' },
            { id: 'confirmed', label: 'مؤكد' },
            { id: 'shipped', label: 'تم الشحن' },
            { id: 'delivered', label: 'تم التسليم' },
          ]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderFilterTab(item.id as FilterTab, item.label)}
          inverted={true} // RTL support for horizontal list
          contentContainerStyle={styles.filterListContainer}
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Package size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>لا توجد طلبات قطع غيار حالياً</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontFamily: typography.h2.fontFamily,
    color: '#D4AF37', // colors.primary.main
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontWeight: 'bold',
  },
  filtersContainer: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  filterListContainer: {
    paddingHorizontal: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#222222',
    marginHorizontal: spacing.xs,
  },
  activeFilterTab: {
    backgroundColor: '#D4AF37',
  },
  filterText: {
    color: colors.text.secondary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
  activeFilterText: {
    color: '#0A0A0A',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  orderCard: {
    backgroundColor: '#121212',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#333333',
  },
  orderHeader: {
    flexDirection: 'row-reverse', // RTL
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  statusContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    fontFamily: typography.caption.fontFamily,
    fontWeight: 'bold',
    marginRight: spacing.xs,
  },
  dateText: {
    color: colors.text.tertiary,
    fontSize: typography.caption.fontSize,
    fontFamily: typography.caption.fontFamily,
  },
  orderDetails: {
    marginBottom: spacing.md,
  },
  productName: {
    color: colors.text.primary,
    fontSize: typography.h3.fontSize,
    fontFamily: typography.h3.fontFamily,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'right', // RTL
  },
  detailRow: {
    flexDirection: 'row-reverse', // RTL
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    color: colors.text.secondary,
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
  },
  detailValue: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
  },
  priceValue: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    marginTop: spacing.sm,
  },
  actionButton: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  actionButtonText: {
    color: colors.background.primary,
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
    fontWeight: 'bold',
    marginRight: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
    marginTop: spacing.md,
  },
});
