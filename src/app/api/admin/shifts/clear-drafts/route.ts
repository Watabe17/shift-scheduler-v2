import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: ドラフトシフトをクリアする
export async function POST(request: Request) {
  try {
    // すべてのドラフトシフトを削除
    const deletedShifts = await prisma.shift.deleteMany({
      where: {
        status: 'DRAFT',
      },
    });

    console.log(`Cleared ${deletedShifts.count} draft shifts`);

    return NextResponse.json({ 
      message: `${deletedShifts.count}件のドラフトシフトを削除しました。`,
      count: deletedShifts.count 
    }, { status: 200 });
  } catch (error) {
    console.error('Error clearing draft shifts:', error);
    return NextResponse.json({ error: 'ドラフトシフトの削除中にエラーが発生しました。' }, { status: 500 });
  }
} 