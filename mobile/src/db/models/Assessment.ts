import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Assessment extends Model {
  static table = 'assessments'

  @field('title') title!: string
  @field('type') type!: string
  @field('subject_id') subjectId!: string
  @field('class_id') classId!: string
  @field('teacher_id') teacherId!: string
  @field('term') term!: string
  @field('year') year!: string
  @field('max_score') maxScore!: number
  @field('date_administered') dateAdministered!: number
  @field('is_published') isPublished!: boolean
  @field('sync_status') syncStatus!: string
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
}