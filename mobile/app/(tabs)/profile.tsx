import { View, Text, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import * as SecureStore from 'expo-secure-store'

export default function ProfileScreen() {
  const { user, school, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('accessToken')
            await SecureStore.deleteItemAsync('refreshToken')
            logout()
            router.replace('/login')
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
      {/* User Info */}
      <Card style={{ marginBottom: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#2563eb',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 32, color: '#ffffff', fontWeight: 'bold' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            {user?.email}
          </Text>
          <View
            style={{
              marginTop: 8,
              backgroundColor: '#eff6ff',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '500' }}>
              {user?.role}
            </Text>
          </View>
        </View>
      </Card>

      {/* School Info */}
      <Card title="School" style={{ marginBottom: 16 }}>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>Name</Text>
          <Text style={{ fontSize: 16, color: '#111827' }}>{school?.name || 'N/A'}</Text>
        </View>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>Type</Text>
          <Text style={{ fontSize: 16, color: '#111827' }}>{school?.type || 'N/A'}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>Slug</Text>
          <Text style={{ fontSize: 16, color: '#111827' }}>{school?.slug || 'N/A'}</Text>
        </View>
      </Card>

      {/* App Info */}
      <Card title="App" style={{ marginBottom: 16 }}>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>Version</Text>
          <Text style={{ fontSize: 16, color: '#111827' }}>1.0.0 (Phase 1)</Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>Platform</Text>
          <Text style={{ fontSize: 16, color: '#111827' }}>Expo (React Native)</Text>
        </View>
      </Card>

      {/* Logout */}
      <Button
        title="Logout"
        onPress={handleLogout}
        variant="destructive"
        size="lg"
      />
    </ScrollView>
  )
}