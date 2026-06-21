import { useState } from 'react'
import { View, Text, Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { database } from '@/db/database'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useSync } from '@/hooks/use-sync'
import { useAuthStore } from '@/store/auth-store'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'

export default function ImportStudentsScreen() {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'done'>('idle')
  const router = useRouter()
  const { triggerSync } = useSync()
  const { user } = useAuthStore()

  const pickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      await importCSV(result.assets[0].uri)
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file')
      console.error(error)
    }
  }

  const importCSV = async (fileUri: string) => {
    setImporting(true)
    setStatus('parsing')

    try {
      // Read CSV file
      const csvContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      const lines = csvContent.split('\n').filter(line => line.trim())
      const header = lines[0].toLowerCase().split(',')

      // Expected columns: admissionNo, firstName, lastName
      const hasHeader = header.some(h => h.includes('admission') || h.includes('first') || h.includes('last'))
      const dataLines = hasHeader ? lines.slice(1) : lines

      setTotalRows(dataLines.length)
      setStatus('importing')

      // Parse CSV and bulk insert
      const students = dataLines.map((line) => {
        const parts = line.split(',').map(s => s.trim())
        return {
          admissionNo: parts[0] || '',
          firstName: parts[1] || '',
          lastName: parts[2] || '',
          enrollmentStatus: (parts[3] || 'ACTIVE').toUpperCase(),
        }
      }).filter(s => s.admissionNo && s.firstName)

      // Bulk insert into WatermelonDB
      let imported = 0
      await database.action(async () => {
        const collection = database.collections.get('students')

        for (const student of students) {
          await collection.create((record: any) => {
            record.admissionNo = student.admissionNo
            record.firstName = student.firstName
            record.lastName = student.lastName
            record.enrollmentStatus = student.enrollmentStatus
            record.syncStatus = 'created'
            record.schoolId = user?.schoolId || ''
            record.createdAt = new Date()
            record.updatedAt = new Date()
          })
          imported++
          setProgress(imported)
        }
      })

      // Trigger sync if online
      await triggerSync()

      setStatus('done')
      Alert.alert(
        'Import Complete',
        `Successfully imported ${imported} students. They will sync when online.`,
        [
          { text: 'OK', onPress: () => router.back() },
        ]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to import CSV. Check file format.')
      console.error(error)
    } finally {
      setImporting(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24 }}>
        Import Students
      </Text>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 12 }}>
          Upload a CSV file with student data. The file should have columns:
        </Text>
        <View style={{ backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 13, color: '#374151' }}>
            admissionNo,firstName,lastName,enrollmentStatus
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: '#6b7280' }}>
          Example: {'\n'}2024-001,John,Doe,ACTIVE{'\n'}2024-002,Jane,Smith,ACTIVE
        </Text>
      </Card>

      {status === 'importing' && totalRows > 0 && (
        <Card style={{ marginBottom: 16, backgroundColor: '#eff6ff' }}>
          <Text style={{ fontWeight: '600', color: '#2563eb', marginBottom: 8 }}>
            Importing: {progress} / {totalRows}
          </Text>
          <View style={{
            height: 8,
            backgroundColor: '#bfdbfe',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <View style={{
              width: `${(progress / totalRows) * 100}%`,
              height: '100%',
              backgroundColor: '#2563eb',
              borderRadius: 4,
            }} />
          </View>
        </Card>
      )}

      {status === 'done' && (
        <Card style={{ marginBottom: 16, backgroundColor: '#f0fdf4' }}>
          <Text style={{ fontWeight: '600', color: '#16a34a', textAlign: 'center' }}>
            ✓ Import complete! {progress} students added.
          </Text>
        </Card>
      )}

      <Button
        title={
          importing
            ? status === 'parsing' ? 'Reading file...' : `Importing... ${progress}/${totalRows}`
            : 'Pick CSV File'
        }
        onPress={pickCSV}
        loading={importing}
        size="lg"
      />

      <Button
        title="Cancel"
        onPress={() => router.back()}
        variant="ghost"
        size="lg"
      />
    </ScrollView>
  )
}