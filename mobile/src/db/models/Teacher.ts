import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Teacher extends Model {
  static table = 'teachers'

  @field('employee_no') employeeNo!: string
  @field('first_name') firstName!: string
  @field('last_name') lastName!: string
  @field('email') email?: string
  @field('phone') phone?: string
  @field('school_id') schoolId!: string
  @field('sync_status') syncStatus!: string
  @readonly @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  async softDelete(): Promise<void> {
    await this.update((record: any) => {
      record.deletedAt = new Date()
      record.syncStatus = 'deleted'
      record.updatedAt = new Date()
    })
  }
}