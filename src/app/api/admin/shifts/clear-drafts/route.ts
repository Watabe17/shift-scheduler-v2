import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    await prisma.shift.deleteMany({
      where: {
        status: 'draft',
      },
    });

    return NextResponse.json({ message: '下書きシフトが削除されました。' });
  } catch (error) {
    console.error('Error clearing draft shifts:', error);
    return NextResponse.json({ error: '下書きシフトの削除中にエラーが発生しました。' }, { status: 500 });
  }
} 