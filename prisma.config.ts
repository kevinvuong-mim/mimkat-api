import 'dotenv/config';
import { env, defineConfig } from 'prisma/config';

export default defineConfig({
  engine: 'classic',
  schema: 'prisma/schema.prisma',
  datasource: { url: env('DATABASE_URL') },
  migrations: { path: 'prisma/migrations' },
});
