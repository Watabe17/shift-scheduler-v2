"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import MenuCardButton from "@/components/MenuCardButton";
import NotificationBell from "@/components/NotificationBell";

// 絵文字アイコンコンポーネント
const CalendarDaysIcon = ({ className }: { className?: string }) => (
  <span className={className}>📅</span>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <span className={className}>🕐</span>
);

const UserIcon = ({ className }: { className?: string }) => (
  <span className={className}>👤</span>
);

const ClipboardDocumentCheckIcon = ({ className }: { className?: string }) => (
  <span className={className}>✅</span>
);

interface ShiftRequest {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  position: {
    name: string;
  };
}

export default function EmployeeDashboard() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShiftRequests = useCallback(async () => {
    try {
      const response = await fetch(`/api/employees/${session?.user?.id}/shift-requests`);
      if (response.ok) {
        const data = await response.json();
        setShiftRequests(data);
      } else {
        console.error('シフト申請の取得に失敗しました');
      }
    } catch (error) {
      console.error('シフト申請の取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchShiftRequests();
  }, [fetchShiftRequests]);

  if ((session?.user as any)?.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  const employeeMenu = [
    {
      href: "/employee/shifts",
      title: "シフト確認",
      description: "自分のシフトを確認します。",
      icon: CalendarDaysIcon,
      color: "bg-blue-500",
    },
    {
      href: "/employee/shift-request",
      title: "シフト申請",
      description: "新しいシフト申請を作成します。",
      icon: ClipboardDocumentCheckIcon,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">従業員ダッシュボード</h1>
            <p className="text-gray-600">ようこそ、{session?.user?.name ?? "従業員"}さん！</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <LogoutButton />
          </div>
        </div>

        {/* シフト申請状況 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">シフト申請状況</h2>
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">読み込み中...</p>
            </div>
          ) : shiftRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">シフト申請はありません</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      期間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      役職
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shiftRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.startDate).toLocaleDateString('ja-JP')} - {new Date(request.endDate).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.startTime} - {request.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.position.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status === 'approved' ? '承認済み' :
                           request.status === 'rejected' ? '却下' : '審査中'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Menu Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">メニュー</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {employeeMenu.map((item) => (
              <MenuCardButton
                key={item.href}
                href={item.href}
                icon={<item.icon className="h-8 w-8 text-white" />}
                title={item.title}
                description={item.description}
                bgColorClass={item.color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
