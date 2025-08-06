import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, adminCode } = await request.json();

    // バリデーション
    if (!name || !email || !password || !adminCode) {
      return NextResponse.json(
        { error: '名前、メールアドレス、パスワード、管理者コードは必須です' },
        { status: 400 }
      );
    }

    // 管理者コードの検証（環境変数から取得）
    const validAdminCode = process.env.ADMIN_REGISTRATION_CODE;
    if (!validAdminCode || adminCode !== validAdminCode) {
      return NextResponse.json(
        { error: '管理者コードが正しくありません' },
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

    // adminユーザーを作成
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // パスワードを除いて返す
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...adminWithoutPassword } = newAdmin;

    return NextResponse.json(adminWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('管理者登録エラー:', error);
    return NextResponse.json(
      { error: '管理者の登録に失敗しました' },
      { status: 500 }
    );
  }
} 