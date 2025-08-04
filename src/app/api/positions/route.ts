import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const positions = await prisma.position.findMany();
    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({ error: 'ポジションの取得中にエラーが発生しました。' }, { status: 500 });
  }
} 