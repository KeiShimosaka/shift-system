import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('🌱 Seeding database...');

  // 管理者
  const adminPw = await bcrypt.hash('admin123', 10);
  await sql`
        INSERT INTO "User" ("name", "password", "role")
        VALUES ('下坂', ${adminPw}, 'ADMIN')
        ON CONFLICT ("name") DO UPDATE SET "password" = ${adminPw}, "role" = 'ADMIN'
    `;
  console.log('  ✅ 管理者: 下坂 / admin123');

  // スタッフA
  const staff1Pw = await bcrypt.hash('staff1', 10);
  await sql`
        INSERT INTO "User" ("name", "password", "role")
        VALUES ('スタッフA', ${staff1Pw}, 'STAFF')
        ON CONFLICT ("name") DO UPDATE SET "password" = ${staff1Pw}
    `;
  console.log('  ✅ スタッフA / staff1');

  // スタッフB
  const staff2Pw = await bcrypt.hash('staff2', 10);
  await sql`
        INSERT INTO "User" ("name", "password", "role")
        VALUES ('スタッフB', ${staff2Pw}, 'STAFF')
        ON CONFLICT ("name") DO UPDATE SET "password" = ${staff2Pw}
    `;
  console.log('  ✅ スタッフB / staff2');

  // スタッフC
  const staff3Pw = await bcrypt.hash('staff3', 10);
  await sql`
        INSERT INTO "User" ("name", "password", "role")
        VALUES ('スタッフC', ${staff3Pw}, 'STAFF')
        ON CONFLICT ("name") DO UPDATE SET "password" = ${staff3Pw}
    `;
  console.log('  ✅ スタッフC / staff3');

  console.log('✅ Seed complete!');
}

main().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
