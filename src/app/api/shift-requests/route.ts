import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, date, startTime, endTime } = body;

    if (!employeeId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: '必須項目が不足しています。' }, { status: 400 });
    }

    const newShiftRequest = await prisma.shiftRequest.create({
      data: {
        employeeId,
        date: new Date(date),
        startTime,
        endTime,
        status: 'PENDING',
      },
    });

    return NextResponse.json(newShiftRequest, { status: 201 });
  } catch (error) {
    console.error('Shift request creation error:', error);
    return NextResponse.json({ error: 'シフト希望の作成中にエラーが発生しました。' }, { status: 500 });
  }
}