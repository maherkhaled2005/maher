// src/utils/alert.ts
import { Platform, Alert } from 'react-native';

type AlertOptions = {
  title: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
};

export const showAlert = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
}: AlertOptions) => {
  Alert.alert(
    title,
    message,
    [
      { text: cancelText, style: 'cancel', onPress: onCancel },
      { text: confirmText, style: 'default', onPress: onConfirm },
    ]
  );
};

export const showError = (message: string) => {
  showAlert({ title: 'خطأ', message });
};

export const showSuccess = (message: string) => {
  showAlert({ title: 'نجاح', message });
};

export const showConfirm = (message: string, onConfirm: () => void) => {
  showAlert({ title: 'تأكيد', message, confirmText: 'نعم، تأكيد', onConfirm });
};
