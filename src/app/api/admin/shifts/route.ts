import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { URL } from 'url';

// GET: 月間のシフト一覧を取得
export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');

  if (!year || !month) {
    return NextResponse.json({ error: '年と月を指定してください。' }, { status: 400 });
  }

  try {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const shifts = await prisma.shift.findMany({
      where: {
        date: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString(),
        },
      },
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

// POST: 新しいシフトを作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("POST /api/admin/shifts received body:", body);
    const { userId, positionId, date, startTime, endTime, shiftRequestId } = body;

    if (!userId || !positionId || !date || !startTime || !endTime) {
      console.log("Missing required fields:", { userId, positionId, date, startTime, endTime });
      return NextResponse.json({ error: '必要な情報が不足しています。' }, { status: 400 });
    }

    const newShift = await prisma.shift.create({
      data: {
        userId: userId,
        positionId,
        date,
        startTime,
        endTime,
        status: 'DRAFT', // 初期ステータスはドラフト
      },
    });
    
    console.log("Created shift:", newShift);
    
    // 元のシフト希望と作成されたシフトをリンクさせる
    if (shiftRequestId) {
        await prisma.shiftRequest.update({
            where: { id: shiftRequestId },
            data: { shiftId: newShift.id }
        })
        console.log("Linked shift request:", shiftRequestId, "to shift:", newShift.id);
    }

    return NextResponse.json(newShift, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json({ error: 'シフトの作成中にエラーが発生しました。' }, { status: 500 });
  }
}
