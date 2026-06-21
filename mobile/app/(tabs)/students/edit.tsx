import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { database } from '@/db/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSync } from '@/hooks/use-sync'

const studentSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  enrollmentStatus: z.enum(['ACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN']),
})

type StudentFormData = z.infer<typeof studentSchema>

export default function EditStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { triggerSync } = useSync()

  const { control, handleSubmit, formState: { errors }, reset } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admissionNo: '',
      firstName: '',
      lastName: '',
      enrollmentStatus: 'ACTIVE',
    },
  })

  useEffect(() => {
    loadStudent()
  }, [id])

  const loadStudent = async () => {
    if (!id) return
    try {
      const student = await database.collections.get('students').find(id)
      const raw = (student as any)._raw || {}
      reset({
        admissionNo: raw.admission_no || '',
        firstName: raw.first_name || '',
        lastName: raw.last_name || '',
        enrollmentStatus: (raw.enrollment_status || 'ACTIVE') as any,
      })
    } catch (error) {
      Alert.alert('Error', 'Student not found')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: StudentFormData) => {
    if (!id) return
    setSaving(true)
    try {
      await database.action(async () => {
        const student = await database.collections.get('students').find(id)
        await student.update((record: any) => {
          record.admissionNo = data.admissionNo
          record.firstName = data.firstName
          record.lastName = data.lastName
          record.enrollmentStatus = data.enrollmentStatus
          record.syncStatus = 'updated'
          record.updatedAt = new Date()
        })
      })

      await triggerSync()

      Alert.alert('Success', 'Student updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (error) {
      Alert.alert('Error', 'Failed to update student')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24 }}>
          Edit Student
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
              autoCapitalize="words"
            />
          )}
        />

        <Button
          title={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSubmit(onSubmit)}
          loading={saving}
          size="lg"
        />

        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="ghost"
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}