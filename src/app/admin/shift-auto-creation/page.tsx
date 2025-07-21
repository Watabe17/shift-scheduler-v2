"use client";

import { useState } from 'react';
import { ShiftRequest } from '@prisma/client';
import { format } from 'date-fns';

type RejectedRequestInfo = {
  request: ShiftRequest & { user: { name: string | null }, position: { name: string } };
  reason: 'USER_OVERLAP' | 'NO_REQUIREMENT' | 'POSITION_FILLED';
}

type AutoCreateResult = {
  createdShiftsCount: number;
  rejectedRequests: RejectedRequestInfo[];
}

const reasonToJapanese = {
  USER_OVERLAP: '本人に重複シフトあり',
  NO_REQUIREMENT: '募集なし',
  POSITION_FILLED: '定員超過',
}

export default function AutoCreateShiftPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AutoCreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAutoCreate = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/shifts/auto-create', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || '不明なエラーが発生しました。');
      }
    } catch (error) {
      console.error('Failed to auto-create shifts:', error);
      setError('シフトの自動生成中にクライアント側でエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">シフト自動作成</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <p className="mb-4">
          従業員から提出された希望シフトを元に、ポジション毎の必要人数を考慮してシフトの草案を自動で作成します。
        </p>
        <p className="mb-6 text-sm text-gray-600">
          この処理は、現在承認待ちの希望シフトを対象とし、重複や定員超過を避けるようにシフトを割り当てます。処理には数秒から数分かかる場合があります。
        </p>
        <button
          onClick={handleAutoCreate}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '作成中...' : 'シフト自動作成を開始'}
        </button>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <h2 className="font-bold">エラー</h2>
            <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">実行結果</h2>
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-md">
            <p className="font-semibold text-green-800">
              シフトの自動生成が完了しました。{result.createdShiftsCount}件のシフトが作成されました。
            </p>
          </div>

          {result.rejectedRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">割り当てられなかった希望シフト ({result.rejectedRequests.length}件)</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">従業員</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ポジション</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">希望日時</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">理由</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.rejectedRequests.map(({ request, reason }) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.position.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(request.date), 'yyyy/MM/dd')} {request.startTime}-{request.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{reasonToJapanese[reason]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 