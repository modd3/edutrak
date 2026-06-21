import { Database } from '@nozbe/watermelondb'
import { SQLiteAdapter } from '@nozbe/watermelondb/adapters/sqlite'

import { schema } from './schema'
import Student from './models/Student'
import Teacher from './models/Teacher'
import Assessment from './models/Assessment'

const adapter = new SQLiteAdapter({
  schema,
  jsi: false,
  onSetUpError: (error: Error) => {
    console.error('Database setup failed:', error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [Student, Teacher, Assessment],
})

export async function resetDatabase(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase()
  })
}