import { sql } from 'drizzle-orm'
import { mysqlTable as table } from 'drizzle-orm/mysql-core'
import * as t from 'drizzle-orm/mysql-core'
import { users } from './users'

export const timesheets = table('ts_timesheets', {
  id: t.serial().notNull(),
  userId: t
    .bigint('user_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => users.id),
  dateTime: t.date('date_time').notNull(),
  startHour: t.time('start_hour'),
  endHour: t.time('end_hour'),
  duration: t.int(), // minutes

  createdAt: t
    .datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: t
    .datetime('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  createdBy: t.bigint('created_by', { mode: 'number', unsigned: true }).notNull(),
  updatedBy: t.bigint('updated_by', { mode: 'number', unsigned: true }),
  createdController: t.varchar('created_controller', { length: 100 }).notNull(),
  updatedController: t.varchar('updated_controller', { length: 100 }),
  isDeleted: t.boolean('is_deleted').notNull().default(false)
})

// Type exports
export type Timesheet = typeof timesheets.$inferSelect
export type InsertTimesheet = typeof timesheets.$inferInsert
