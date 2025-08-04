import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const body = await request.json();
    const { startTime, endTime, positionId } = body;

    // 自分のシフト申請のみ更新可能
    const shiftRequest = await prisma.shiftRequest.findUnique({
      where: { id: params.id },
    });

    if (!shiftRequest || shiftRequest.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません。' }, { status: 403 });
    }

    const updatedShiftRequest = await prisma.shiftRequest.update({
      where: { id: params.id },
      data: {
        startTime,
        endTime,
        positionId,
      },
      include: {
        user: true,
        position: true,
      },
    });

    return NextResponse.json(updatedShiftRequest);
  } catch (error) {
    console.error('Error updating shift request:', error);
    return NextResponse.json({ error: 'シフト申請の更新中にエラーが発生しました。' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    // 自分のシフト申請のみ削除可能
    const shiftRequest = await prisma.shiftRequest.findUnique({
      where: { id: params.id },
    });

    if (!shiftRequest || shiftRequest.userId !== session.user.id) {
      return NextResponse.json({ error: '権限がありません。' }, { status: 403 });
    }

    await prisma.shiftRequest.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting shift request:', error);
    return NextResponse.json({ error: 'シフト申請の削除中にエラーが発生しました。' }, { status: 500 });
  }
} 