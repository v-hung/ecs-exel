import { sql } from 'drizzle-orm'
import { mysqlTable as table } from 'drizzle-orm/mysql-core'
import * as t from 'drizzle-orm/mysql-core'

export const users = table(
  'm_users',
  {
    id: t.serial().notNull(),
    name: t.varchar({ length: 64 }).notNull(),
    username: t.varchar({ length: 128 }).notNull(),
    password: t.varchar({ length: 128 }),
    dayOffNumber: t.int('day_off_number'),
    isFirstTimeChangePassword: t.boolean('is_first_time_change_password').notNull().default(false),

    createdAt: t
      .datetime('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: t
      .datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
    createdBy: t.int('created_by').notNull(),
    updatedBy: t.int('updated_by'),
    createdController: t.varchar('created_controller', { length: 100 }).notNull(),
    updatedController: t.varchar('updated_controller', { length: 100 }),
    isDeleted: t.boolean('is_deleted').notNull().default(false),

    timesheetType: t.int('timesheet_type'),
    empId: t.varchar('emp_id', { length: 45 }),
    birthDay: t.datetime('birth_day'),
    phone: t.varchar('phone', { length: 64 }),
    nationality: t.varchar('nationality', { length: 45 }),
    gender: t.boolean().default(false), // 1 = Man, 0 = Women
    workStt: t.boolean('work_stt'),
    department: t.int(),

    perAddress: t.varchar('per_address', { length: 500 }),
    address: t.varchar('address', { length: 500 }),
    identNum: t.varchar('ident_num', { length: 45 }),
    identDate: t.datetime('ident_date'),
    identAddr: t.varchar('ident_addr', { length: 250 }),

    bankAccnum: t.varchar('bank_accnum', { length: 45 }),
    bankAccname: t.varchar('bank_accname', { length: 200 }),
    insuNum: t.varchar('insu_num', { length: 45 }),
    taxCode: t.varchar('tax_code', { length: 45 }),
    householdCode: t.varchar('household_code', { length: 45 }),

    qualification: t.varchar('qualification', { length: 45 }),
    position: t.int(),
    levelSkill: t.int('level_skill'),
    contractType: t.int('contract_type'),
    contractStart: t.datetime('contract_start'),
    contractEnd: t.datetime('contract_end'),

    fatherName: t.varchar('father_name', { length: 45 }),
    fatherBirth: t.datetime('father_birth'),
    motherName: t.varchar('mother_name', { length: 45 }),
    motherBirth: t.datetime('mother_birth'),

    relationship: t.int(),
    relationshipName: t.varchar('relationship_name', { length: 45 }),
    relationshipBirth: t.datetime('relationship_birth'),
    children: t.varchar('children', { length: 500 }),
    siblings: t.varchar('siblings', { length: 500 }),

    isSendmail: t.int('is_sendmail'),
    sendDate: t.datetime('send_date'),
    isHead: t.boolean('is_head').default(false),
    isOnboardmail: t.boolean('is_onboardmail').default(false),
    onboardmailDate: t.datetime('onboardmail_date')
  },
  (table) => [t.uniqueIndex('uni_username').on(table.username)]
)

// Type exports
export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
