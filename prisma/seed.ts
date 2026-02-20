import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  // 管理者
  const adminPw = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { name: '下坂' },
    update: { password: adminPw, role: 'ADMIN' },
    create: { name: '下坂', password: adminPw, role: 'ADMIN' },
  });

  // スタッフ
  const staff1Pw = await bcrypt.hash('staff1', 10);
  await prisma.user.upsert({
    where: { name: 'スタッフA' },
    update: { password: staff1Pw },
    create: { name: 'スタッフA', password: staff1Pw, role: 'STAFF' },
  });

  const staff2Pw = await bcrypt.hash('staff2', 10);
  await prisma.user.upsert({
    where: { name: 'スタッフB' },
    update: { password: staff2Pw },
    create: { name: 'スタッフB', password: staff2Pw, role: 'STAFF' },
  });

  const staff3Pw = await bcrypt.hash('staff3', 10);
  await prisma.user.upsert({
    where: { name: 'スタッフC' },
    update: { password: staff3Pw },
    create: { name: 'スタッフC', password: staff3Pw, role: 'STAFF' },
  });

  console.log('✅ Seed data inserted!');
  console.log('  管理者: 下坂 / admin123');
  console.log('  スタッフA / staff1');
  console.log('  スタッフB / staff2');
  console.log('  スタッフC / staff3');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
