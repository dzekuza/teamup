import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { Brand } from '@/constants/theme';

type InputState = 'default' | 'focused' | 'error' | 'disabled';

const BORDER_COLOR: Record<InputState, string> = {
  default: Brand.border,
  focused: Brand.borderFocused,
  error: Brand.borderError,
  disabled: '#222222',
};

const LABEL_COLOR: Record<InputState, string> = {
  default: Brand.textSecondary,
  focused: Brand.accent,
  error: Brand.borderError,
  disabled: Brand.textDisabled,
};

interface AppTextInputProps extends TextInputProps {
  label: string;
  error?: string;
  disabled?: boolean;
}

export function AppTextInput({
  label,
  error,
  disabled = false,
  ...rest
}: AppTextInputProps) {
  const [focused, setFocused] = useState(false);

  const state: InputState = disabled
    ? 'disabled'
    : error
    ? 'error'
    : focused
    ? 'focused'
    : 'default';

  return (
    <View>
      <Text
        style={[styles.label, { color: LABEL_COLOR[state] }]}
        accessibilityElementsHidden
      >
        {label}
      </Text>
      <RNTextInput
        style={[styles.input, { borderColor: BORDER_COLOR[state] }]}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        placeholderTextColor="#555555"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Brand.surface,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Brand.textPrimary,
  },
  error: {
    fontSize: 12,
    color: Brand.borderError,
    marginTop: 4,
  },
});
