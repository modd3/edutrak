import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '@/store/auth-store'

export default function RootLayout() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore()
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      await restoreSession()
      setAppReady(true)
    }
    init()
  }, [])

  if (!appReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="login" options={{ headerShown: false }} />
        )}
      </Stack>
    </>
  )
}