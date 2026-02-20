import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    console.log('🔧 Creating tables...');

    // User テーブル作成
    await sql`
        CREATE TABLE IF NOT EXISTS "User" (
            "id" SERIAL PRIMARY KEY,
            "name" TEXT NOT NULL UNIQUE,
            "password" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'STAFF'
        )
    `;
    console.log('  ✅ User table created');

    // Shift テーブル作成
    await sql`
        CREATE TABLE IF NOT EXISTS "Shift" (
            "id" SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL,
            "date" TEXT NOT NULL,
            "available" BOOLEAN NOT NULL DEFAULT true,
            "time" TEXT,
            CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
            CONSTRAINT "Shift_userId_date_key" UNIQUE ("userId", "date")
        )
    `;
    console.log('  ✅ Shift table created');

    console.log('✅ Database setup complete!');
}

main().catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
});
