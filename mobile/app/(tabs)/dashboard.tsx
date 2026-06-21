import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native'
import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
import { useSync } from '@/hooks/use-sync'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { api } from '@/api/client'

export default function DashboardScreen() {
  const { user, school } = useAuthStore()
  const { triggerSync, isOnline, isSyncing, lastSyncTime, syncError } = useSync()
  const [refreshing, setRefreshing] = useState(false)

  // Fetch dashboard metrics (cached by TanStack Query)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', user?.schoolId],
    queryFn: async () => {
      const response = await api.get('/dashboard/metrics')
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    networkMode: 'offlineFirst',
    retry: 1,
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetch(), triggerSync()])
    setRefreshing(false)
  }, [])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
        Welcome, {user?.firstName || 'User'}
      </Text>
      <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
        {school?.name || 'School'} • {user?.role || 'User'}
      </Text>

      {/* Sync Status */}
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isOnline ? '#22c55e' : '#ef4444',
                marginRight: 8,
              }}
            />
            <Text style={{ fontSize: 14, color: '#374151' }}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Button
            title={isSyncing ? 'Syncing...' : 'Sync'}
            onPress={triggerSync}
            loading={isSyncing}
            size="sm"
            variant="secondary"
          />
        </View>
        {lastSyncTime && (
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            Last synced: {lastSyncTime.toLocaleTimeString()}
          </Text>
        )}
        {syncError && (
          <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
            Sync error: {syncError}
          </Text>
        )}
      </Card>

      {/* Error State */}
      {error && (
        <Card style={{ marginBottom: 16, backgroundColor: '#fef2f2' }}>
          <Text style={{ color: '#dc2626', fontSize: 14 }}>
            Could not load latest data. Showing cached data.
          </Text>
        </Card>
      )}

      {/* Metrics Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Card style={{ flex: 1, minWidth: '45%' }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Total Students</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2563eb' }}>
            {data?.totalStudents ?? 0}
          </Text>
        </Card>

        <Card style={{ flex: 1, minWidth: '45%' }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Total Teachers</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#16a34a' }}>
            {data?.totalTeachers ?? 0}
          </Text>
        </Card>

        <Card style={{ flex: 1, minWidth: '45%' }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Classes</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#7c3aed' }}>
            {data?.totalClasses ?? 0}
          </Text>
        </Card>

        <Card style={{ flex: 1, minWidth: '45%' }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>Pending Assessments</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ea580c' }}>
            {data?.pendingAssessments ?? 0}
          </Text>
        </Card>
      </View>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        {data?.recentActivity?.length > 0 ? (
          data.recentActivity.map((activity: any, index: number) => (
            <View
              key={activity.id || index}
              style={{
                borderBottomWidth: index < data.recentActivity.length - 1 ? 1 : 0,
                borderBottomColor: '#e5e7eb',
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontSize: 14, color: '#374151' }}>
                {activity.description}
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {activity.timestamp}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>
            No recent activity
          </Text>
        )}
      </Card>
    </ScrollView>
  )
}