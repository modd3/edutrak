import { useState } from 'react'
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/api/client'
import * as SecureStore from 'expo-secure-store'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setSession } = useAuthStore()

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email')
      return
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password')
      return
    }

    setLoading(true)
    try {
      const response = await authApi.login(email.trim(), password)

      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', response.accessToken)
      await SecureStore.setItemAsync('refreshToken', response.refreshToken)

      // Set session in Zustand store
      setSession(response)

      // Navigate to dashboard
      router.replace('/(tabs)/dashboard')
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please check your credentials.'
      Alert.alert('Login Failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#ffffff',
        }}
      >
        {/* Logo / App Name */}
        <Text
          style={{
            fontSize: 36,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#2563eb',
            marginBottom: 8,
          }}
        >
          EduTrak
        </Text>
        <Text
          style={{
            fontSize: 16,
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: 48,
          }}
        >
          School Management System
        </Text>

        {/* Login Form */}
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="admin@school.co.ke"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          size="lg"
        />

        <Text
          style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: 12,
            marginTop: 24,
          }}
        >
          Works offline after first login
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}