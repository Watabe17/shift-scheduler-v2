import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    console.log('--- Shift Requests API Start ---');
    
    const url = new URL(request.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');
    
    console.log('Month:', month, 'Year:', year);

    const whereCondition: any = {};

    if (month && year) {
      try {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        
        // ISO-8601 DateTime形式に変換
        const startDateISO = startDate.toISOString();
        const endDateISO = endDate.toISOString();
        
        console.log('Start Date:', startDateISO, 'End Date:', endDateISO);
        
        whereCondition.date = {
          gte: startDateISO,
          lte: endDateISO,
        };
      } catch (dateError) {
        console.error('Date parsing error:', dateError);
        throw dateError;
      }
    }

    console.log('Where Condition:', whereCondition);

    try {
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

      console.log('Found shift requests:', shiftRequests.length);
      console.log('--- Shift Requests API End ---');

      return NextResponse.json(shiftRequests);
    } catch (prismaError) {
      console.error('Prisma error:', prismaError);
      throw prismaError;
    }
  } catch (error) {
    console.error('Error fetching shift requests:', error);
    return NextResponse.json({ error: 'シフト申請の取得中にエラーが発生しました。' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const body = await request.json();
    const { date, positionId, startTime, endTime } = body;

    if (!date || !positionId || !startTime || !endTime) {
      return NextResponse.json({ error: '必要な情報が不足しています。' }, { status: 400 });
    }

    // 日付をISO-8601 DateTime形式に変換
    const formattedDate = new Date(date + 'T00:00:00.000Z').toISOString();

    const shiftRequest = await prisma.shiftRequest.create({
      data: {
        userId: session.user.id,
        positionId,
        date: formattedDate,
        startTime,
        endTime,
        status: 'pending',
      },
      include: {
        user: true,
        position: true,
      },
    });

    return NextResponse.json(shiftRequest);
  } catch (error) {
    console.error('Error creating shift request:', error);
    return NextResponse.json({ error: 'シフト申請の作成中にエラーが発生しました。' }, { status: 500 });
  }
}