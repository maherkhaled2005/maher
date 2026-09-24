import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
  keyboardType?: any;
  error?: string;
  leftIcon?: React.ReactNode;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label, value, onChangeText, placeholder, secure = false,
  multiline = false, numberOfLines = 1, style, keyboardType,
  error, leftIcon, editable = true, autoCapitalize, autoCorrect,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.wrapper, error ? styles.wrapperError : null, !editable ? styles.wrapperDisabled : null]}>
        {leftIcon && <View style={{ marginLeft: spacing.sm }}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, multiline && { height: Math.max(44, numberOfLines * 28), textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          secureTextEntry={secure && !showPassword}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlign="right"
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: spacing.xs }}>
            {showPassword
              ? <EyeOff color={colors.gray} size={20} />
              : <Eye color={colors.gray} size={20} />}
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.sizes.sm,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  wrapperError: { borderColor: colors.danger },
  wrapperDisabled: { opacity: 0.6 },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.white,
    fontSize: typography.sizes.md,
    minHeight: 44,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    textAlign: 'right',
    marginTop: 4,
  },
});

export default Input;
