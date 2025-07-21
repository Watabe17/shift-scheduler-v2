"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Position, ShiftRequest } from "@prisma/client";

interface EmployeeShiftRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { startTime: string; endTime: string; positionId: string; }) => void;
  onUpdate: (id: string, data: { startTime: string; endTime: string; positionId: string; }) => void;
  onDelete: (id: string) => void;
  date: Date;
  positions: Position[];
  requestToEdit?: ShiftRequest | null;
  availableTimeSlots: string[];
}

export default function EmployeeShiftRequestModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  date,
  positions,
  requestToEdit,
}: EmployeeShiftRequestModalProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [positionId, setPositionId] = useState<string>("");
  const isEditMode = !!requestToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && requestToEdit) {
            setStartTime(requestToEdit.startTime);
            setEndTime(requestToEdit.endTime);
            setPositionId(requestToEdit.positionId);
        } else {
            // Reset for new request
            setStartTime("09:00");
            setEndTime("17:00");
            if (positions.length > 0) {
                setPositionId(positions[0].id);
            }
        }
    }
  }, [isOpen, requestToEdit, isEditMode, positions]);


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!positionId) {
        alert("役職を選択してください。");
        return;
    }
    if (isEditMode && requestToEdit) {
        onUpdate(requestToEdit.id, { startTime, endTime, positionId });
    } else {
        onCreate({ startTime, endTime, positionId });
    }
  };

  const handleDelete = () => {
    if (isEditMode && requestToEdit) {
        if (confirm("このシフト希望を削除しますか？")) {
            onDelete(requestToEdit.id);
        }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
          {isEditMode ? '希望シフト編集' : '希望シフト提出'}
        </h2>
        <p className="text-center text-gray-600 mb-6">{format(requestToEdit ? new Date(requestToEdit.date) : date, "yyyy年M月d日 (E)", { locale: ja })}</p>
        
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
          <div className="flex gap-4">
            <div className="w-1/2">
              <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">開始時刻</label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">終了時刻</label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <div>
              {isEditMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-900 hover:bg-red-100 rounded-md transition-colors"
                  >
                    削除
                  </button>
              )}
            </div>
            <div className="flex justify-end gap-3">
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
                {isEditMode ? '更新する' : '提出する'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 