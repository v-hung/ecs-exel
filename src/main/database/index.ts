import { drizzle } from 'drizzle-orm/mysql2'
import { createPool } from 'mysql2/promise'
import * as schema from './schema'

const connection = createPool({
  uri: import.meta.env.MAIN_VITE_DATABASE_URL ?? ''
})

const db = drizzle({
  client: connection,
  mode: 'default',
  schema: schema
})

export default db
