import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 特定のシフト申請を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const shiftRequest = await prisma.shiftRequest.findUnique({
      where: { id },
      include: {
        user: true,
        position: true,
      },
    });

    if (!shiftRequest) {
      return NextResponse.json({ error: 'シフト申請が見つかりません。' }, { status: 404 });
    }

    return NextResponse.json(shiftRequest);
  } catch (error) {
    console.error('Error fetching shift request:', error);
    return NextResponse.json({ error: 'シフト申請の取得中にエラーが発生しました。' }, { status: 500 });
  }
}

// PUT: シフト申請を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, startTime, endTime, positionId } = body;

    if (!date || !startTime || !endTime || !positionId) {
      return NextResponse.json({ error: '必要なフィールドが不足しています。' }, { status: 400 });
    }

    const updatedRequest = await prisma.shiftRequest.update({
      where: { id },
      data: {
        date: new Date(date),
        startTime,
        endTime,
        positionId,
      },
      include: {
        user: true,
        position: true,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating shift request:', error);
    return NextResponse.json({ error: 'シフト申請の更新中にエラーが発生しました。' }, { status: 500 });
  }
}

// DELETE: シフト申請を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.shiftRequest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'シフト申請が削除されました。' });
  } catch (error) {
    console.error('Error deleting shift request:', error);
    return NextResponse.json({ error: 'シフト申請の削除中にエラーが発生しました。' }, { status: 500 });
  }
} 