import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { database } from '@/db/database'
import Student from '@/db/models/Student'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/api/client'
import { useSync } from '@/hooks/use-sync'

interface StudentDisplay {
  id: string
  firstName: string
  lastName: string
  admissionNo: string
  enrollmentStatus: string
  syncStatus: string
}

/**
 * Helper to map WatermelonDB Model (raw) → StudentDisplay for rendering.
 * WatermelonDB's observe() returns base Model[] not Student[],
 * so we need to extract the raw values.
 */
function modelToDisplay(model: any): StudentDisplay {
  const raw = model._raw || {}
  return {
    id: model.id,
    firstName: model.firstName || raw.first_name || '',
    lastName: model.lastName || raw.last_name || '',
    admissionNo: model.admissionNo || raw.admission_no || '',
    enrollmentStatus: model.enrollmentStatus || raw.enrollment_status || 'ACTIVE',
    syncStatus: model.syncStatus || raw.sync_status || 'synced',
  }
}

export default function StudentsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [localStudents, setLocalStudents] = useState<StudentDisplay[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const { triggerSync } = useSync()

  // Fetch from server (with offlineFirst cache)
  const { data: serverData, isLoading: serverLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students')
      return response.data as StudentDisplay[]
    },
    networkMode: 'offlineFirst',
    staleTime: 10 * 60 * 1000,
  })

  // Subscribe to local WatermelonDB changes (instant UI updates)
  useEffect(() => {
    const subscription = database.collections
      .get('students')
      .query()
      .observe()
      .subscribe((records) => {
        setLocalStudents(records.map(modelToDisplay))
      })

    return () => subscription.unsubscribe()
  }, [])

  // Combine local + server data
  const displayStudents = localStudents.length > 0 ? localStudents : (serverData || [])

  // Filter by search
  const filteredStudents = displayStudents.filter((student) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const name = `${student.firstName} ${student.lastName}`.toLowerCase()
    const adm = student.admissionNo.toLowerCase()
    return name.includes(q) || adm.includes(q)
  })

  const handleAddStudent = () => {
    router.push('/students/new')
  }

  const handleEditStudent = (studentId: string) => {
    router.push(`/students/edit?id=${studentId}`)
  }

  const handleDeleteStudent = (student: StudentDisplay) => {
    Alert.alert(
      'Delete Student',
      `Delete ${student.firstName} ${student.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.action(async () => {
                const record = await database.collections.get('students').find(student.id)
                await (record as any).update((r: any) => {
                  r.deletedAt = new Date()
                  r.syncStatus = 'deleted'
                  r.updatedAt = new Date()
                })
              })
              await triggerSync()
            } catch (error) {
              Alert.alert('Error', 'Failed to delete student')
            }
          },
        },
      ]
    )
  }

  const renderSyncBadge = (status: string) => {
    const colors: Record<string, string> = {
      synced: '#9ca3af',
      pending: '#f59e0b',
      created: '#3b82f6',
      updated: '#8b5cf6',
      deleted: '#ef4444',
    }
    return (
      <Text style={{ fontSize: 11, color: colors[status] || '#9ca3af', marginLeft: 8 }}>
        ● {status}
      </Text>
    )
  }

  const renderStudent = ({ item }: { item: StudentDisplay }) => (
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
      onPress={() => handleEditStudent(item.id)}
      onLongPress={() => handleDeleteStudent(item)}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
            Adm: {item.admissionNo}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{
              fontSize: 12,
              color: item.enrollmentStatus === 'ACTIVE' ? '#16a34a' : '#dc2626',
              backgroundColor: item.enrollmentStatus === 'ACTIVE' ? '#f0fdf4' : '#fef2f2',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              {item.enrollmentStatus}
            </Text>
            {renderSyncBadge(item.syncStatus)}
          </View>
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
      {/* Header */}
      <View style={{ padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button title="Add Student" onPress={handleAddStudent} />
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
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
              No students found. Add your first student!
            </Text>
          )
        }
      />
    </View>
  )
}