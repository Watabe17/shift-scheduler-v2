const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'test@example.com';
  const plainPassword = 'password123';

  // パスワードをハッシュ化
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  console.log(`Updating password for ${email}`);
  console.log(`New hashed password: ${hashedPassword}`);

  try {
    const updatedUser = await prisma.employee.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
      },
    });
    console.log('Password updated successfully for user:', updatedUser.name);
  } catch (error) {
    console.error('Failed to update password:', error);
    if (error.code === 'P2025') {
        console.error(`\n[エラー] メールアドレス "${email}" のユーザーが見つかりませんでした。`);
        console.error('Prisma Studioで、まず "テスト太郎" (test@example.com) のユーザーが作成されているか確認してください。');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
