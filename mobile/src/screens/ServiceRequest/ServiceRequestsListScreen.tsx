import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Wrench, Clock, CheckCircle, XCircle, DollarSign, Plus, ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import { normalizeRole } from '../../utils/permissions';

type RequestStatus = 'new' | 'waiting_for_technician' | 'assigned' | 'waiting_for_price' | 'waiting_for_customer_approval' | 'payment_pending' | 'paid' | 'in_progress' | 'waiting_for_part' | 'part_received' | 'completed' | 'customer_confirmed' | 'rated' | 'cancelled';

interface ServiceRequest {
  id: string;
  referenceNumber: string;
  deviceType: string;
  status: RequestStatus;
  customerName?: string;
  technicianName?: string;
  createdAt: string;
  totalAmount?: number;
}

const getStatusColor = (status: RequestStatus) => {
  switch (status) {
    case 'new':
    case 'waiting_for_technician':
      return '#FF9800';
    case 'assigned':
    case 'in_progress':
    case 'waiting_for_price':
    case 'waiting_for_part':
    case 'part_received':
      return '#2196F3';
    case 'payment_pending':
    case 'paid':
      return '#9C27B0';
    case 'completed':
    case 'customer_confirmed':
    case 'rated':
      return '#4CAF50';
    case 'cancelled':
      return '#F44336';
    case 'waiting_for_customer_approval':
      return '#FF5722';
    default:
      return colors.textSecondary;
  }
};

const getStatusArabic = (status: RequestStatus) => {
  const map: Record<RequestStatus, string> = {
    new: 'جديد',
    waiting_for_technician: 'بحث عن فني',
    assigned: 'تم التعيين',
    waiting_for_price: 'انتظار السعر',
    waiting_for_customer_approval: 'انتظار موافقتك',
    payment_pending: 'انتظار الدفع',
    paid: 'تم الدفع',
    in_progress: 'جارٍ الصيانة',
    waiting_for_part: 'انتظار قطعة',
    part_received: 'وصلت القطعة',
    completed: 'اكتملت الخدمة',
    customer_confirmed: 'تم التأكيد',
    rated: 'تم التقييم',
    cancelled: 'ملغي',
  };
  return map[status] || status;
};

export default function ServiceRequestsListScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  
  const role = normalizeRole(user?.role);
  const isCustomer = role === 'customer';
  const isTechnician = role === 'technician';

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/service-requests');
      if (response.data?.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRequests();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const getFilteredRequests = () => {
    return requests.filter(req => {
      if (filter === 'active') {
        return !['completed', 'customer_confirmed', 'rated', 'cancelled'].includes(req.status);
      }
      if (filter === 'completed') {
        return ['completed', 'customer_confirmed', 'rated'].includes(req.status);
      }
      if (filter === 'cancelled') {
        return req.status === 'cancelled';
      }
      return true;
    });
  };

  const availableRequests = isTechnician 
    ? requests.filter(req => req.status === 'waiting_for_technician')
    : [];
    
  const filteredRequests = getFilteredRequests().filter(req => 
    isTechnician ? req.status !== 'waiting_for_technician' : true
  );

  const renderRequestItem = ({ item }: { item: ServiceRequest }) => {
    const statusColor = getStatusColor(item.status);
    const date = new Date(item.createdAt).toLocaleDateString('ar-SA');

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ServiceRequestDetails', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.refNumber}>{item.referenceNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{getStatusArabic(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.deviceType}>{item.deviceType}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          
          {(item.totalAmount && item.totalAmount > 0) ? (
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>{item.totalAmount} ج.م</Text>
            </View>
          ) : null}
        </View>

        {(item.customerName || item.technicianName) && (
          <View style={styles.personContainer}>
            <Text style={styles.personText}>
              {isCustomer ? `الفني: ${item.technicianName || 'غير محدد'}` : `العميل: ${item.customerName || 'غير محدد'}`}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>طلبات الصيانة</Text>
      </View>

      <View style={styles.filterTabs}>
        {(['all', 'active', 'completed', 'cancelled'] as const).map(tab => {
          const labels = {
            all: 'الكل',
            active: 'نشط',
            completed: 'مكتمل',
            cancelled: 'ملغي'
          };
          return (
            <TouchableOpacity 
              key={tab} 
              style={[styles.filterTab, filter === tab && styles.activeFilterTab]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterTabText, filter === tab && styles.activeFilterTabText]}>
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            isTechnician && availableRequests.length > 0 ? (
              <View style={styles.availableSection}>
                <Text style={styles.sectionTitle}>طلبات متاحة</Text>
                {availableRequests.map(item => (
                  <View key={item.id} style={{ marginBottom: spacing.sm }}>
                    {renderRequestItem({ item })}
                  </View>
                ))}
                <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>طلباتي</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Wrench size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>لا توجد طلبات صيانة</Text>
            </View>
          }
        />
      )}

      {isCustomer && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('CreateServiceRequest')}
        >
          <Plus size={24} color={colors.background} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    ...typography.h2,
    color: '#fff',
    textAlign: 'center',
  },
  filterTabs: {
    flexDirection: 'row-reverse',
    padding: spacing.sm,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
  },
  activeFilterTab: {
    backgroundColor: colors.primary + '20',
  },
  filterTabText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  activeFilterTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  refNumber: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  deviceType: {
    ...typography.h3,
    color: '#fff',
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  amountContainer: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  amountText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: 'bold',
  },
  personContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  personText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  availableSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'right',
    marginBottom: spacing.md,
  }
});
