import { View, Text, TextInput, StyleSheet } from 'react-native'
import { useRef, useState } from 'react'

interface InputProps {
  value: string
  onChangeText: (text: string) => void
  onBlur?: () => void
  placeholder?: string
  label?: string
  error?: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  multiline?: boolean
  numberOfLines?: number
  editable?: boolean
  style?: object
}

export function Input({
  value,
  onChangeText,
  onBlur,
  placeholder,
  label,
  error,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onBlur={() => {
          setIsFocused(false)
          onBlur?.()
        }}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          multiline && { minHeight: numberOfLines * 24 },
          !editable && { backgroundColor: '#f3f4f6' },
          { height: multiline ? 'auto' : 48 },
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  inputFocused: {
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
})