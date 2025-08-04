import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: シフトを確定する
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json({ error: '年と月を指定してください。' }, { status: 400 });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    // 指定された月のドラフトシフトを確定ステータスに更新
    const updatedShifts = await prisma.shift.updateMany({
      where: {
        date: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString(),
        },
        status: 'DRAFT',
      },
      data: {
        status: 'CONFIRMED',
      },
    });

    console.log(`Finalized ${updatedShifts.count} shifts for ${year}/${month}`);

    return NextResponse.json({ 
      message: `${year}年${month}月のシフトを確定しました。`,
      count: updatedShifts.count 
    }, { status: 200 });
  } catch (error) {
    console.error('Error finalizing shifts:', error);
    return NextResponse.json({ error: 'シフトの確定中にエラーが発生しました。' }, { status: 500 });
  }
} 