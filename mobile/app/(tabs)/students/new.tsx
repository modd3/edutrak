import { useState } from 'react'
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { database } from '@/db/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSync } from '@/hooks/use-sync'
import { useAuthStore } from '@/store/auth-store'

const studentSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  enrollmentStatus: z.enum(['ACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN']),
})

type StudentFormData = z.infer<typeof studentSchema>

export default function NewStudentScreen() {
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { triggerSync } = useSync()
  const { user } = useAuthStore()

  const { control, handleSubmit, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admissionNo: '',
      firstName: '',
      lastName: '',
      enrollmentStatus: 'ACTIVE',
    },
  })

  const onSubmit = async (data: StudentFormData) => {
    setSaving(true)
    try {
      await database.action(async () => {
        await database.collections.get('students').create((student: any) => {
          student.admissionNo = data.admissionNo
          student.firstName = data.firstName
          student.lastName = data.lastName
          student.enrollmentStatus = data.enrollmentStatus
          student.syncStatus = 'created'
          student.schoolId = user?.schoolId || ''
          student.createdAt = new Date()
          student.updatedAt = new Date()
        })
      })

      // Trigger sync if online
      await triggerSync()

      Alert.alert('Success', 'Student created successfully. Will sync when online.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (error) {
      Alert.alert('Error', 'Failed to create student')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24 }}>
          Add Student
        </Text>

        <Controller
          control={control}
          name="admissionNo"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Admission Number"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.admissionNo?.message}
              placeholder="e.g. 2024-001"
              autoCapitalize="characters"
            />
          )}
        />

        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="First Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.firstName?.message}
              placeholder="e.g. John"
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Last Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.lastName?.message}
              placeholder="e.g. Doe"
              autoCapitalize="words"
            />
          )}
        />

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
            Enrollment Status
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['ACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN'] as const).map((status) => (
              <Controller
                key={status}
                control={control}
                name="enrollmentStatus"
                render={({ field: { onChange, value } }) => (
                  <Button
                    title={status.charAt(0) + status.slice(1).toLowerCase()}
                    onPress={() => onChange(status)}
                    variant={value === status ? 'default' : 'outline'}
                    size="sm"
                  />
                )}
              />
            ))}
          </View>
        </View>

        <Button
          title={saving ? 'Creating...' : 'Create Student'}
          onPress={handleSubmit(onSubmit)}
          loading={saving}
          size="lg"
        />

        <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
          Student will sync to server when you are online
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Note: We need to add onBlur to the Input component. Let me check if it exists.