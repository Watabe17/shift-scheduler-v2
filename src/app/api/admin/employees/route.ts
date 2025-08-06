import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

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

    // ユーザーアカウントを作成
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // roleはデフォルトで "employee" になります
      },
    });

    // パスワードを除いて返す
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
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
    const users = await prisma.user.findMany({
      where: {
        role: 'employee',
      },
      include: {
        positions: {
          include: {
            position: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    // データを整形して返す
    const employeesWithPositions = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      positions: user.positions.map(ep => ep.position),
    }));

    return NextResponse.json(employeesWithPositions);
  } catch (error) {
    console.error('従業員一覧取得エラー:', error);
    return NextResponse.json(
      { error: '従業員一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
