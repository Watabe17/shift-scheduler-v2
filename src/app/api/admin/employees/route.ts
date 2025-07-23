import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // バリデーション
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '名前、メールアドレス、パスワードは必須です' },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await hash(password, 10);

    // 従業員アカウントを作成
    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER', // 従業員は'USER'ロール
      },
    });

    // パスワードを除いて返す
    const { password: _, ...employeeWithoutPassword } = newEmployee;

    return NextResponse.json(employeeWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('従業員作成エラー:', error);
    return NextResponse.json(
      { error: '従業員の作成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 従業員一覧を取得（管理者以外）
    const employees = await prisma.user.findMany({
      where: {
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('従業員一覧取得エラー:', error);
    return NextResponse.json(
      { error: '従業員一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
} 