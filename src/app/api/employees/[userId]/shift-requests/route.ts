import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    
    const shiftRequests = await prisma.shiftRequest.findMany({
      where: { userId },
      include: {
        position: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(shiftRequests);
  } catch (error) {
    console.error('Error fetching shift requests:', error);
    return NextResponse.json({ error: 'シフト申請の取得中にエラーが発生しました。' }, { status: 500 });
  }
}
