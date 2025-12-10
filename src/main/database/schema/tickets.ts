import { sql } from 'drizzle-orm'
import { mysqlTable as table } from 'drizzle-orm/mysql-core'
import * as t from 'drizzle-orm/mysql-core'
import { users } from './users'

export const tickets = table('ts_tickets', {
  id: t.serial().notNull(),
  userId: t
    .bigint('user_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => users.id),
  approverId: t.bigint('approver_id', { mode: 'number' }).notNull(),
  dateTime: t.date('date_time').notNull(),
  startHour: t.time('start_hour'),
  endHour: t.time('end_hour'),
  duration: t.float(),
  type: t.int(), // 0: nghỉ, 1: đi muộn, 2: về sớm, 3: làm thêm
  status: t.int(), // 0: waiting, 1: accept, 2: reject
  note: t.text(),

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

export const TicketType = {
  NGHI: 0,
  DI_MUON: 1,
  VE_SOM: 2,
  LAM_THEM: 3
} as const

export const TicketStatus = {
  WAITING: 0,
  ACCEPT: 1,
  REJECT: 2
} as const

// Type exports
export type Ticket = typeof tickets.$inferSelect
export type InsertTicket = typeof tickets.$inferInsert
