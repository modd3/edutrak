import { View, Text, ScrollView } from 'react-native'
import { Card } from '@/components/ui/Card'

export default function AssessmentsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
        Assessments
      </Text>

      <Card title="Phase 2 Feature">
        <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>
          Assessment creation and score entry will be implemented in Phase 2.
          This includes:
        </Text>
        <View style={{ marginTop: 12 }}>
          {[
            'Create exams, assignments, and projects',
            'Enter scores offline (critical for rural schools)',
            'Auto-calculate CBC competency levels (EE, ME, AE, BE)',
            'Support both CBC and 8-4-4 grading systems',
            'Batch score entry for quick data capture',
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