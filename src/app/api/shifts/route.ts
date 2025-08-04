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

    const whereCondition: any = {
      userId: session.user.id,
      status: 'CONFIRMED', // 承認済みのシフトのみ
    };

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      whereCondition.date = {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      };
    }

    const shifts = await prisma.shift.findMany({
      where: whereCondition,
      include: {
        user: true,
        position: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json({ error: 'シフトの取得中にエラーが発生しました。' }, { status: 500 });
  }
} 