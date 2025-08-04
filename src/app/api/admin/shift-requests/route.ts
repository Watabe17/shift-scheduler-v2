import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { URL } from 'url';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  try {
    const whereCondition: any = {};
    if (status) {
      whereCondition.status = status;
    }

    const shiftRequests = await prisma.shiftRequest.findMany({
      where: whereCondition,
      include: {
        user: true,
        position: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(shiftRequests);
  } catch (error) {
    console.error('Error fetching shift requests:', error);
    return NextResponse.json({ error: 'シフト希望の取得中にエラーが発生しました。' }, { status: 500 });
  }
}
