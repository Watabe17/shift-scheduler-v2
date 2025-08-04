import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH: シフト申請のステータスを更新
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: '無効なステータスです。' }, { status: 400 });
    }

    const updatedRequest = await prisma.shiftRequest.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        position: true,
      },
    });

    console.log(`Updated shift request ${id} status to ${status}`);

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    console.error('Error updating shift request:', error);
    return NextResponse.json({ error: 'シフト申請の更新中にエラーが発生しました。' }, { status: 500 });
  }
} 