import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './src/main/database/migrations',
  schema: './src/main/database/schema',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  strict: false
})
