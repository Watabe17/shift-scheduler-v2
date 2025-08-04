import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  const userId = context.params.userId;
  console.log('API called with userId:', userId);

  if (!userId) {
    console.log('No userId provided');
    return NextResponse.json({ error: 'ユーザーIDが必要です。' }, { status: 400 });
  }

  try {
    console.log('Querying database for userId:', userId);
    const shiftRequests = await prisma.shiftRequest.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        date: 'asc',
      },
    });
    console.log('Found shift requests:', shiftRequests.length);
    return NextResponse.json(shiftRequests);
  } catch (error) {
    console.error('Error fetching shift requests:', error);
    return NextResponse.json({ error: 'シフト希望の取得中にエラーが発生しました。' }, { status: 500 });
  }
}
