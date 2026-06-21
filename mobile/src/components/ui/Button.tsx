import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native'

interface ButtonProps {
  title: string
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

const variantStyles: Record<string, { bg: string; text: string }> = {
  default: { bg: '#2563eb', text: '#ffffff' },
  destructive: { bg: '#dc2626', text: '#ffffff' },
  outline: { bg: 'transparent', text: '#2563eb' },
  secondary: { bg: '#e5e7eb', text: '#111827' },
  ghost: { bg: 'transparent', text: '#111827' },
}

const sizeStyles: Record<string, { height: number; padding: number; fontSize: number }> = {
  default: { height: 48, padding: 16, fontSize: 16 },
  sm: { height: 36, padding: 12, fontSize: 14 },
  lg: { height: 56, padding: 24, fontSize: 18 },
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'default',
  size = 'default',
  className = '',
}: ButtonProps) {
  const vs = variantStyles[variant]
  const ss = sizeStyles[size]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          height: ss.height,
          paddingHorizontal: ss.padding,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: vs.text,
              fontSize: ss.fontSize,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
})