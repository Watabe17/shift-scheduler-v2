import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  const userId = params.employeeId;

  if (!userId) {
    return NextResponse.json({ error: 'ユーザーIDが必要です。' }, { status: 400 });
  }

  try {
    const shiftRequests = await prisma.shiftRequest.findMany({
      where: {
        userId: userId,
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
