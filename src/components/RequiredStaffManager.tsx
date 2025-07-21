"use client";

import { useState, FormEvent } from 'react';
import { Position, RequiredStaff } from "@prisma/client";
import { toast } from 'react-toastify';

interface PositionWithStaff extends Position {
  requiredStaffs: RequiredStaff[];
}

interface RequiredStaffManagerProps {
  position: PositionWithStaff;
  onUpdate: () => void;
}

const DAYS_OF_WEEK = [
  { label: "日", value: 0 }, { label: "月", value: 1 }, { label: "火", value: 2 },
  { label: "水", value: 3 }, { label: "木", value: 4 }, { label: "金", value: 5 }, { label: "土", value: 6 }
];

export default function RequiredStaffManager({ position, onUpdate }: RequiredStaffManagerProps) {
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [timeSlot, setTimeSlot] = useState('');
  const [count, setCount] = useState<number>(1);

  const handleAddRule = async (e: FormEvent) => {
    e.preventDefault();
    if (!timeSlot.trim() || count < 1) {
      toast.error("時間帯と人数を正しく入力してください。");
      return;
    }

    try {
      const res = await fetch('/api/admin/required-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId: position.id, dayOfWeek, timeSlot, count }),
      });
      if (!res.ok) throw new Error("ルールの追加に失敗しました。");
      
      toast.success("ルールを追加しました。");
      setTimeSlot('');
      setCount(1);
      onUpdate(); // 親コンポーネントのデータ再取得をトリガー
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateCount = async (ruleId: string, newCount: number) => {
    if(newCount < 0) {
        toast.error("人数は0以上で入力してください。");
        return;
    }
    try {
        const res = await fetch(`/api/admin/required-staff/${ruleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: newCount })
        });
        if (!res.ok) throw new Error("人数の更新に失敗しました。");
        toast.success("人数を更新しました。");
        onUpdate();
    } catch (error: any) {
        toast.error(error.message);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if(!confirm("このルールを削除しますか？")) return;
    try {
        const res = await fetch(`/api/admin/required-staff/${ruleId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("ルールの削除に失敗しました。");
        toast.success("ルールを削除しました。");
        onUpdate();
    } catch (error: any) {
        toast.error(error.message);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="p-4 border rounded-md bg-gray-50">
        <h4 className="font-semibold text-md mb-3">新しいルールを追加</h4>
        <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col">
            <label htmlFor={`day-${position.id}`} className="text-sm font-medium text-gray-600">曜日</label>
            <select
              id={`day-${position.id}`}
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="p-2 border rounded-md text-sm"
            >
              {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor={`time-${position.id}`} className="text-sm font-medium text-gray-600">時間帯</label>
            <input
              id={`time-${position.id}`}
              type="text"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              placeholder="例: 09:00-17:00"
              className="p-2 border rounded-md text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor={`count-${position.id}`} className="text-sm font-medium text-gray-600">必要人数</label>
            <input
              id={`count-${position.id}`}
              type="number"
              min="1"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="p-2 border rounded-md text-sm"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 h-fit text-sm">
            追加
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-md">既存のルール</h4>
        {position.requiredStaffs.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {position.requiredStaffs.map(rule => (
              <li key={rule.id} className="p-2 flex justify-between items-center hover:bg-gray-50 rounded-md">
                <div className="flex-1">
                  <span className="font-bold text-gray-800">{DAYS_OF_WEEK.find(d => d.value === rule.dayOfWeek)?.label}曜日</span>
                  <span className="ml-4 text-gray-600">{rule.timeSlot}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    defaultValue={rule.count}
                    onBlur={(e) => handleUpdateCount(rule.id, Number(e.target.value))}
                    className="w-16 p-1 border rounded-md text-center"
                  />
                  <span>人</span>
                  <button onClick={() => handleDeleteRule(rule.id)} className="text-red-500 hover:text-red-700 p-1 text-sm">
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">まだルールが設定されていません。</p>
        )}
      </div>
    </div>
  );
} 