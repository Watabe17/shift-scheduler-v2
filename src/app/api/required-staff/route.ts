import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const requiredStaff = await prisma.requiredStaff.findMany({
      include: {
        position: true,
      },
    });
    return NextResponse.json(requiredStaff);
  } catch (error) {
    console.error('Error fetching required staff:', error);
    return NextResponse.json({ error: '必要人数の取得中にエラーが発生しました。' }, { status: 500 });
  }
} 