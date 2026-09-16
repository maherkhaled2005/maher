import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Edit3, ArrowRightLeft } from 'lucide-react-native';
import { fetchApi } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

export default function WarehouseInventoryScreen({ route, navigation }: any) {
  const warehouseName = route.params?.name || 'مخزن غير معروف';
  const warehouseId = route.params?.id || 1;
  
  // Modals state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Update Stock Form
  const [updateQty, setUpdateQty] = useState('');
  const [updateReason, setUpdateReason] = useState('جرد');

  // Transfer Form
  const [transferDest] = useState('مخزن الجيزة');
  const [transferQty, setTransferQty] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [inventory, setInventory] = useState<any[]>([]);

  const loadInventory = () => {
    fetchApi(`/warehouses/${warehouseId}/inventory`)
      .then(res => setInventory(res.data || res || []))
      .catch(console.error);
  };

  React.useEffect(() => {
    loadInventory();
  }, [warehouseId]);

  const handleUpdateStock = () => {
    if (!updateQty) return;
    setInventory(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, qty: Number(updateQty) } : p));
    setShowUpdateModal(false);
    Alert.alert('نجاح', 'تم تحديث المخزون بنجاح ✅');
  };

  const handleTransfer = () => {
    if (!transferQty || !transferReason) {
      Alert.alert('خطأ', 'الرجاء إدخال الكمية والسبب');
      return;
    }
    const qtyNum = Number(transferQty);
    if (qtyNum > selectedProduct.qty) {
      Alert.alert('عذراً', 'الكمية المطلوبة للتحويل غير متوفرة بالمخزن.');
      return;
    }
    setInventory(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, qty: p.qty - qtyNum } : p));
    setShowTransferModal(false);
    Alert.alert('نجاح', `تم تحويل ${qtyNum} قطعة إلى ${transferDest} بنجاح ✅`);
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: '#0A0A0A' },
        
      ]}
    >
      {/* ☰ Owner Header with Drawer navigation & back button */}
      <OwnerHeader
        title="مخزون المخزن"
        subtitle={warehouseName}
        navigation={navigation}
        currentScreen="Warehouses"
        showBack
        onRefresh={loadInventory}
      />

      <FlatList
        data={inventory}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Text style={{ color: '#71717A', fontSize: 15, fontWeight: '700' }}>لا توجد أصناف في هذا المخزن حالياً</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#141414', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#27272A', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15, marginBottom: 4, textAlign: 'right' }}>{item.name}</Text>
              <Text style={{ color: '#71717A', fontSize: 12, textAlign: 'right', marginBottom: 10 }}>{item.category}</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <Text style={{ color: item.qty > 0 ? '#10b981' : '#ef4444', fontWeight: '900', fontSize: 14 }}>{item.qty} قطعة</Text>
                <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '700' }}>المتوفر:</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => { setSelectedProduct(item); setTransferQty(''); setTransferReason(''); setShowTransferModal(true); }} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1F23', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#27272A', gap: 6 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>تحويل</Text>
                  <ArrowRightLeft color="#D4AF37" size={14} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setSelectedProduct(item); setUpdateQty(item.qty.toString()); setShowUpdateModal(true); }} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#D4AF37', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 }}>
                  <Text style={{ color: '#0A0A0A', fontSize: 12, fontWeight: '900' }}>تحديث</Text>
                  <Edit3 color="#0A0A0A" size={14} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Image source={{ uri: item.image }} style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#1F1F23' }} />
          </View>
        )}
      />

      {/* Update Stock Modal */}
      {selectedProduct && (
        <Modal visible={showUpdateModal} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
              <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#27272A' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 20 }}>تحديث الكمية: {selectedProduct.name}</Text>
                
                <Text style={{ color: '#D4AF37', fontWeight: '800', textAlign: 'right', marginBottom: 8 }}>الكمية الجديدة (فعلية)</Text>
                <TextInput style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#27272A', borderRadius: 12, padding: 14, textAlign: 'right', color: '#FFFFFF', fontWeight: '900', fontSize: 18, marginBottom: 16 }} keyboardType="numeric" value={updateQty} onChangeText={setUpdateQty} placeholderTextColor="#71717A" />

                <Text style={{ color: '#D4AF37', fontWeight: '800', textAlign: 'right', marginBottom: 8 }}>سبب التعديل</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 24 }}>
                  {['مفقود', 'تالف', 'جرد'].map(reason => (
                    <TouchableOpacity key={reason} onPress={() => setUpdateReason(reason)} style={{ flex: 1, backgroundColor: updateReason === reason ? '#D4AF37' : '#1F1F23', borderWidth: 1, borderColor: updateReason === reason ? '#D4AF37' : '#27272A', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}>
                      <Text style={{ color: updateReason === reason ? '#0A0A0A' : '#FFFFFF', fontWeight: '800' }}>{reason}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => setShowUpdateModal(false)} style={{ flex: 1, backgroundColor: '#1F1F23', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272A' }}>
                    <Text style={{ color: '#A1A1AA', fontWeight: '800' }}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleUpdateStock} style={{ flex: 1, backgroundColor: '#D4AF37', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>تحديث الكمية</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Transfer Modal */}
      {selectedProduct && (
        <Modal visible={showTransferModal} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
              <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#27272A' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 20 }}>تحويل: {selectedProduct.name}</Text>
                
                <Text style={{ color: '#D4AF37', fontWeight: '800', textAlign: 'right', marginBottom: 8 }}>مخزن الوجهة</Text>
                <View style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#27272A', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', textAlign: 'right' }}>{transferDest}</Text>
                </View>

                <Text style={{ color: '#D4AF37', fontWeight: '800', textAlign: 'right', marginBottom: 8 }}>الكمية المراد تحويلها</Text>
                <TextInput style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#27272A', borderRadius: 12, padding: 14, textAlign: 'right', color: '#FFFFFF', fontWeight: '900', fontSize: 18, marginBottom: 16 }} placeholder={`أقصى حد: ${selectedProduct.qty}`} placeholderTextColor="#71717A" keyboardType="numeric" value={transferQty} onChangeText={setTransferQty} />

                <Text style={{ color: '#D4AF37', fontWeight: '800', textAlign: 'right', marginBottom: 8 }}>سبب التحويل</Text>
                <TextInput style={{ backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: '#27272A', borderRadius: 12, padding: 14, textAlign: 'right', color: '#FFFFFF', fontWeight: '700', marginBottom: 24 }} placeholder="مثال: تغطية عجز المخزن" placeholderTextColor="#71717A" value={transferReason} onChangeText={setTransferReason} />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => setShowTransferModal(false)} style={{ flex: 1, backgroundColor: '#1F1F23', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272A' }}>
                    <Text style={{ color: '#A1A1AA', fontWeight: '800' }}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleTransfer} style={{ flex: 1, backgroundColor: '#D4AF37', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>تأكيد التحويل</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

    </SafeAreaView>
  );
}
