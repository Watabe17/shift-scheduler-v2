"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ShiftRequestData } from "./ShiftRequestModal";
import { Position } from "@prisma/client";

interface AddShiftCardProps {
  selectedDate: Date;
  onSubmit: (data: { date: string; startTime: string; endTime: string; positionId: string; }) => void;
  onClose: () => void;
  positions: Position[];
}

export default function AddShiftCard({
  selectedDate,
  onSubmit,
  onClose,
  positions,
}: AddShiftCardProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [positionId, setPositionId] = useState<string>("");

  // Set initial positionId when positions are loaded or selectedDate changes
  useEffect(() => {
    if (positions.length > 0 && !positionId) {
      setPositionId(positions[0].id);
    }
  }, [positions, positionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionId) {
        alert("役職を選択してください。");
        return;
    }
    onSubmit({
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime,
      endTime,
      positionId,
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 w-full max-w-xl mx-auto mt-4 animate-fade-in-up">
      <h3 className="text-lg font-semibold text-center text-gray-800 mb-4">
        シフトを追加: {format(selectedDate, "MMMM d (EEE)", { locale: ja })}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">役職</label>
            <select
              id="position"
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              required
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">開始時刻</label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">終了時刻</label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 items-center mt-4">
           <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            シフトを提出
          </button>
        </div>
      </form>
    </div>
  );
} 