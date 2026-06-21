import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { database } from '@/db/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/api/client'
import { useSync } from '@/hooks/use-sync'

interface TeacherDisplay {
  id: string
  firstName: string
  lastName: string
  employeeNo: string
  email: string
  phone: string
  syncStatus: string
}

function modelToDisplay(model: any): TeacherDisplay {
  const raw = model._raw || {}
  return {
    id: model.id,
    firstName: model.firstName || raw.first_name || '',
    lastName: model.lastName || raw.last_name || '',
    employeeNo: model.employeeNo || raw.employee_no || '',
    email: model.email || raw.email || '',
    phone: model.phone || raw.phone || '',
    syncStatus: model.syncStatus || raw.sync_status || 'synced',
  }
}

export default function TeachersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [localTeachers, setLocalTeachers] = useState<TeacherDisplay[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const { triggerSync } = useSync()

  const { data: serverData, isLoading: serverLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers')
      return response.data as TeacherDisplay[]
    },
    networkMode: 'offlineFirst',
    staleTime: 10 * 60 * 1000,
  })

  useEffect(() => {
    const subscription = database.collections
      .get('teachers')
      .query()
      .observe()
      .subscribe((records) => {
        setLocalTeachers(records.map(modelToDisplay))
      })
    return () => subscription.unsubscribe()
  }, [])

  const displayTeachers = localTeachers.length > 0 ? localTeachers : (serverData || [])

  const filteredTeachers = displayTeachers.filter((teacher) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const name = `${teacher.firstName} ${teacher.lastName}`.toLowerCase()
    const emp = teacher.employeeNo.toLowerCase()
    return name.includes(q) || emp.includes(q)
  })

  const handleAddTeacher = () => {
    Alert.alert('Add Teacher', 'Teacher creation form coming soon')
  }

  const renderTeacher = ({ item }: { item: TeacherDisplay }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#ffffff',
        padding: 16,
        marginBottom: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
      }}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
          Emp: {item.employeeNo}
        </Text>
        {item.email ? (
          <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
            {item.email}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>
            ● {item.syncStatus}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await triggerSync()
    setRefreshing(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <Input
          placeholder="Search teachers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button title="Add Teacher" onPress={handleAddTeacher} />
      </View>

      <FlatList
        data={filteredTeachers}
        renderItem={renderTeacher}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          serverLoading ? (
            <View style={{ paddingVertical: 32 }}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <Text style={{ textAlign: 'center', color: '#9ca3af', paddingVertical: 32 }}>
              No teachers found.
            </Text>
          )
        }
      />
    </View>
  )
}