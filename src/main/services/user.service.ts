import db from '../database'
import { UserDto } from '../types/user.type'

export const getUsers = async (): Promise<UserDto[]> => {
  const users = await db.query.users.findMany({
    columns: { id: true, name: true, username: true, timesheetType: true },
    where: (users, { eq }) => eq(users.isDeleted, false)
  })

  return users
}

export const getUserByIds = async (ids: number[]): Promise<UserDto[]> => {
  const users = await db.query.users.findMany({
    columns: { id: true, name: true, username: true, timesheetType: true },
    where: (users, { and, inArray, eq }) => and(eq(users.isDeleted, false), inArray(users.id, ids))
  })

  return users
}

export const getUserById = async (id: number): Promise<UserDto | null> => {
  const user = await db.query.users.findFirst({
    columns: { id: true, name: true, username: true, timesheetType: true },
    where: (users, { and, eq }) => and(eq(users.id, id), eq(users.isDeleted, false))
  })

  return user ?? null
}
