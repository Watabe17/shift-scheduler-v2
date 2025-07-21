"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale"; // Import Japanese locale

type ShiftRequestStatus = "pending" | "approved" | "rejected";

// APIから返されるデータの型
interface ShiftRequestAdminView {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ShiftRequestStatus; // Changed from ShiftStatus to string
  user: {
    name: string;
    email: string;
  };
  position: {
    name: string;
  };
}

export default function AdminShiftRequestPage() {
  const [requests, setRequests] = useState<ShiftRequestAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/shift-requests");
      if (!res.ok) {
        throw new Error("Failed to fetch shift requests.");
      }
      const data: ShiftRequestAdminView[] = await res.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: ShiftRequestStatus) => {
    try {
      const res = await fetch(`/api/admin/shift-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status.");
      }
      // Update the state locally for immediate feedback
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === id ? { ...req, status: status } : req
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const StatusBadge = ({ status }: { status: ShiftRequestStatus }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    const statusClasses: Record<ShiftRequestStatus, string> = {
      pending: "bg-yellow-200 text-yellow-800",
      approved: "bg-green-200 text-green-800",
      rejected: "bg-red-200 text-red-800",
    };

    const statusText: Record<ShiftRequestStatus, string> = {
      pending: "保留中",
      approved: "承認済み",
      rejected: "拒否済み",
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{statusText[status]}</span>;
  };

  if (isLoading) return <div className="p-4">読み込み中...</div>;
  if (error) return <div className="p-4 text-red-500">エラー: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">シフトリクエスト管理</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                従業員
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                役職
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                日付
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                時間
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{req.user.name}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{req.position.name}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {format(new Date(req.date), "yyyy年MM月dd日(EEEE)", { locale: ja })}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {req.startTime} - {req.endTime}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {req.status === "pending" && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(req.id, "approved")}
                        className="px-3 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
                      >
                        承認
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, "rejected")}
                        className="px-3 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                      >
                        拒否
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 