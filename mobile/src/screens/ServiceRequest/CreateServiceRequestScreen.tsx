import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView, Modal, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Wrench, MapPin, ChevronDown, CheckCircle, ArrowLeft, Package } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';

const CreateServiceRequestScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [deviceType, setDeviceType] = useState<any>(null);
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [governorate, setGovernorate] = useState<any>(null);
  const [address, setAddress] = useState('');
  
  const [showDeviceTypeModal, setShowDeviceTypeModal] = useState(false);
  const [showGovernorateModal, setShowGovernorateModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [deviceTypesRes, governoratesRes] = await Promise.all([
        api.get('/device-types').catch(() => ({ data: [] })), // using correct path or fallback
        api.get('/governorates').catch(() => ({ data: [] }))
      ]);
      // Assuming api wrapper prepends baseURL so we use just relative paths usually.
      // But based on prompt, use /api/...
      setDeviceTypes(deviceTypesRes.data || []);
      setGovernorates(governoratesRes.data || []);
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!deviceType || !problemDescription.trim() || !governorate || !address.trim()) {
      Alert.alert('تنبيه', 'الرجاء تعبئة جميع الحقول المطلوبة (نوع الجهاز، المشكلة، المحافظة، العنوان بالتفصيل)');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post('/service-requests', {
        deviceTypeId: deviceType.id || deviceType._id, // Support different id fields
        deviceBrand,
        deviceModel,
        problemDescription,
        governorateId: governorate.id || governorate._id,
        address
      });
      
      Alert.alert('نجاح', 'تم تقديم طلب الصيانة بنجاح', [
        { text: 'حسناً', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDropdownModal = (
    visible: boolean,
    close: () => void,
    data: any[],
    onSelect: (item: any) => void,
    title: string,
    keyExtractor: (item: any) => string,
    labelExtractor: (item: any) => string
  ) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={close} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={keyExtractor}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  onSelect(item);
                  close();
                }}
              >
                <Text style={styles.modalItemText}>{labelExtractor(item)}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>لا توجد بيانات متاحة</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#D4AF37" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلب صيانة جديد</Text>
        <View style={{ width: 24 }} /> {/* Empty space for centering */}
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>معلومات الجهاز</Text>
                <Package color="#D4AF37" size={20} />
              </View>

              <Text style={styles.label}>نوع الجهاز *</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDeviceTypeModal(true)}>
                <Text style={deviceType ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                  {deviceType ? deviceType.name : 'اختر نوع الجهاز'}
                </Text>
                <ChevronDown color="#AAAAAA" size={20} />
              </TouchableOpacity>

              <Text style={styles.label}>العلامة التجارية (اختياري)</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: Samsung, Apple, LG"
                placeholderTextColor="#666666"
                value={deviceBrand}
                onChangeText={setDeviceBrand}
                textAlign="right"
              />

              <Text style={styles.label}>الموديل (اختياري)</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: iPhone 13 Pro"
                placeholderTextColor="#666666"
                value={deviceModel}
                onChangeText={setDeviceModel}
                textAlign="right"
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>تفاصيل المشكلة</Text>
                <Wrench color="#D4AF37" size={20} />
              </View>

              <Text style={styles.label}>وصف المشكلة *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="اشرح المشكلة التي تواجهها بالتفصيل..."
                placeholderTextColor="#666666"
                value={problemDescription}
                onChangeText={setProblemDescription}
                multiline
                numberOfLines={4}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>الموقع</Text>
                <MapPin color="#D4AF37" size={20} />
              </View>

              <Text style={styles.label}>المحافظة *</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowGovernorateModal(true)}>
                <Text style={governorate ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                  {governorate ? governorate.name : 'اختر المحافظة'}
                </Text>
                <ChevronDown color="#AAAAAA" size={20} />
              </TouchableOpacity>

              <Text style={styles.label}>العنوان بالتفصيل *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="المنطقة، الشارع، رقم المبنى، أقرب معلم..."
                placeholderTextColor="#666666"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>إرسال الطلب</Text>
                  <CheckCircle color="#0A0A0A" size={20} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderDropdownModal(
        showDeviceTypeModal,
        () => setShowDeviceTypeModal(false),
        deviceTypes,
        setDeviceType,
        'اختر نوع الجهاز',
        (item) => item.id?.toString() || item._id?.toString() || Math.random().toString(),
        (item) => item.name
      )}

      {renderDropdownModal(
        showGovernorateModal,
        () => setShowGovernorateModal(false),
        governorates,
        setGovernorate,
        'اختر المحافظة',
        (item) => item.id?.toString() || item._id?.toString() || Math.random().toString(),
        (item) => item.name
      )}
    </SafeAreaView>
  );
};

export default CreateServiceRequestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    padding: 8,
    marginRight: -8, // To align perfectly
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  sectionTitle: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    minHeight: 100,
  },
  pickerButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row', // left-to-right to keep chevron on left, text on right
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pickerTextPlaceholder: {
    color: '#666666',
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  pickerTextSelected: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#0A0A0A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#D4AF37',
    fontSize: 16,
  },
  modalItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'right',
  },
  emptyText: {
    color: '#AAAAAA',
    textAlign: 'center',
    padding: 40,
    fontSize: 16,
  },
});
