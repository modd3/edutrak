import { View, Text, ScrollView } from 'react-native'
import { Card } from '@/components/ui/Card'

export default function AttendanceScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
        Attendance
      </Text>

      <Card title="Phase 2 Feature">
        <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>
          Attendance tracking will be implemented in Phase 2. Features include:
        </Text>
        <View style={{ marginTop: 12 }}>
          {[
            'Mark attendance with 3 taps (Present/Absent/Late)',
            'Works completely offline',
            'Syncs automatically when online',
            'View attendance history per student',
            'Generate attendance reports',
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ color: '#2563eb', marginRight: 8 }}>•</Text>
              <Text style={{ fontSize: 14, color: '#374151', flex: 1 }}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  )
}