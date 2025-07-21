"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import MenuCardButton from "@/components/MenuCardButton";
import NotificationBell from "@/components/NotificationBell";
import {
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  UsersIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { WrenchScrewdriverIcon, UserPlusIcon } from "@heroicons/react/24/solid";

const adminMenu = [
  {
    href: "/admin/shift-requests",
    title: "シフト申請",
    description: "従業員のシフト申請を承認または却下します。",
    icon: ClipboardDocumentCheckIcon,
    color: "bg-blue-500",
  },
  {
    href: "/admin/shift-creation",
    title: "シフト作成",
    description: "承認された申請から確定シフトを作成します。",
    icon: CalendarDaysIcon,
    color: "bg-green-500",
  },
  {
    href: "/admin/shifts",
    title: "確定シフト",
    description: "すべての確定シフトを表示・管理します。",
    icon: UsersIcon,
    color: "bg-yellow-500",
  },
  {
    href: "/admin/positions",
    title: "役職管理",
    description: "役職と必要人数を管理します。",
    icon: WrenchScrewdriverIcon,
    color: "bg-purple-500",
  },
  {
    href: "/admin/employees",
    title: "従業員管理",
    description: "従業員アカウントを追加または管理します。",
    icon: UserPlusIcon,
    color: "bg-red-500",
  }
];

interface DashboardStats {
  pendingRequestCount: number;
  shiftsThisWeekCount: number;
  staffingShortagesCount: number;
}

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="mr-4">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export default function AdminDashboard() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/admin/dashboard-stats');
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (session?.user.role !== "ADMIN") {
    // This will be handled by the onUnauthenticated callback, but as a fallback
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">アクセス拒否</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">管理者ダッシュボード</h1>
            <p className="text-gray-600">ようこそ、{session?.user?.name ?? "管理者"}さん！</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          <LogoutButton />
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">今週の概要</h2>
            {isLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    <div className="bg-white/50 h-24 rounded-lg shadow-md"></div>
                    <div className="bg-white/50 h-24 rounded-lg shadow-md"></div>
                    <div className="bg-white/50 h-24 rounded-lg shadow-md"></div>
                 </div>
            ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="保留中のシフト申請" 
                        value={stats.pendingRequestCount}
                        icon={<ClockIcon className="h-10 w-10 text-blue-500" />}
                    />
                    <StatCard 
                        title="今週のシフト" 
                        value={stats.shiftsThisWeekCount} 
                        icon={<CheckCircleIcon className="h-10 w-10 text-green-500" />}
                    />
                    <StatCard 
                        title="人員不足" 
                        value={stats.staffingShortagesCount}
                        icon={<ExclamationTriangleIcon className={`h-10 w-10 ${stats.staffingShortagesCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />}
                    />
                </div>
            ) : (
                <p className="text-center text-gray-500">ダッシュボードの統計データを読み込めませんでした。</p>
            )}
        </div>

        {/* Menu Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">管理メニュー</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {adminMenu.map((item) => (
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