import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json({ error: '年と月のパラメータが必要です。' }, { status: 400 });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const shifts = await prisma.shift.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString(),
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    let totalMinutes = 0;

    shifts.forEach(shift => {
      const startTime = new Date(`1970-01-01T${shift.startTime}`);
      const endTime = new Date(`1970-01-01T${shift.endTime}`);
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      totalMinutes += diffMinutes;
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return NextResponse.json({
      totalHours,
      totalMinutes: remainingMinutes,
    });
  } catch (error) {
    console.error('Error calculating total hours:', error);
    return NextResponse.json({ error: '総勤務時間の計算中にエラーが発生しました。' }, { status: 500 });
  }
} 