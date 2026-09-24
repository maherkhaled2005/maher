// src/components/common/CustomModal.tsx
import React, { ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function CustomModal({ visible, onClose, title, children }: CustomModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#18181B',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    padding: 20,
    elevation: 8,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 480,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    paddingBottom: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D4AF37',
    textAlign: 'right',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '900',
  },
});
