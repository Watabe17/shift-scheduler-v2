import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
  request: Request,
  context: { params: { employeeId: string } }
) {
  const { employeeId } = context.params;

  if (!employeeId) {
    return NextResponse.json({ error: '従業員IDが必要です。' }, { status: 400 });
  }

  try {
    const shiftRequests = await prisma.shiftRequest.findMany({
      where: {
        employeeId: employeeId,
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
