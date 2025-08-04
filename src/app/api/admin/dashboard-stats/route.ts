import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 保留中のシフト申請数を取得
    const pendingRequestCount = await prisma.shiftRequest.count({
      where: {
        status: 'pending'
      }
    });

    // 今週のシフト数を取得
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 日曜日を週の開始とする
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    // 日付を文字列形式に変換（YYYY-MM-DD形式）
    const startOfWeekStr = startOfWeek.getFullYear() + '-' + 
      String(startOfWeek.getMonth() + 1).padStart(2, '0') + '-' + 
      String(startOfWeek.getDate()).padStart(2, '0');
    const endOfWeekStr = endOfWeek.getFullYear() + '-' + 
      String(endOfWeek.getMonth() + 1).padStart(2, '0') + '-' + 
      String(endOfWeek.getDate()).padStart(2, '0');
    
    const shiftsThisWeekCount = await prisma.shift.count({
      where: {
        date: {
          gte: startOfWeekStr,
          lt: endOfWeekStr
        }
      }
    });

    // 人員不足の計算（簡易版）
    // 実際の実装では、RequiredStaffと実際のシフト数を比較する必要があります
    const staffingShortagesCount = 0; // 仮の値

    return NextResponse.json({
      pendingRequestCount,
      shiftsThisWeekCount,
      staffingShortagesCount
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'ダッシュボードの統計データの取得に失敗しました。' },
      { status: 500 }
    );
  }
} 