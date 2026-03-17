import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
  secureTextEntry?: boolean;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
  multiline = false,
  secureTextEntry = false,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : undefined,
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            multiline && styles.multiline,
            icon ? styles.inputWithIcon : undefined,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.danger,
  },
  icon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  multiline: {
    height: 100,
    paddingTop: 12,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
    marginTop: 4,
  },
});
