import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const positions = await prisma.position.findMany({
      include: {
        requiredStaffs: true,
      },
    });
    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({ error: 'ポジションの取得中にエラーが発生しました。' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'ポジション名が必要です。' }, { status: 400 });
    }

    const position = await prisma.position.create({
      data: {
        name: name,
      },
    });

    return NextResponse.json(position);
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json({ error: 'ポジションの作成中にエラーが発生しました。' }, { status: 500 });
  }
}
