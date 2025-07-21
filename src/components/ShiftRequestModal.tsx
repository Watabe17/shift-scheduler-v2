"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// --- Types ---
interface Position {
  id: string;
  name: string;
}

export interface ShiftRequestData {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  positionId: string;
}

interface ShiftRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ShiftRequestData) => void;
  onDelete?: (id: string) => void;
  type: "new" | "edit";
  event?: { resource: { id: string, date: string, startTime: string, endTime: string, position: { id: string } } };
  slot?: { start: Date, end: Date };
  positions: Position[];
}

// --- Component ---
export default function ShiftRequestModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  type,
  event,
  slot,
  positions,
}: ShiftRequestModalProps) {
  const [formData, setFormData] = useState<ShiftRequestData>({
    id: undefined,
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    positionId: "",
  });

  useEffect(() => {
    const initialPositionId = positions.length > 0 ? positions[0].id : "";

    if (type === "edit" && event) {
      const { resource } = event;
      setFormData({
        id: resource.id,
        date: format(new Date(resource.date), "yyyy-MM-dd"),
        startTime: resource.startTime,
        endTime: resource.endTime,
        positionId: resource.position.id,
      });
    } else if (type === "new" && slot) {
      setFormData({
        id: undefined,
        date: format(slot.start, "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "17:00",
        positionId: initialPositionId,
      });
    }
  }, [type, event, slot, positions]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
  };
  
  const handleDelete = () => {
    if(onDelete && formData.id) {
        onDelete(formData.id);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in-up">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-lg font-semibold text-center text-gray-800 mb-4">
          {type === "new" ? "シフト希望を提出" : `シフト希望を編集: ${event?.resource ? format(new Date(event.resource.date), "MMMM d (EEE)", { locale: ja }) : ''}`}
        </h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">役職</label>
            <select
              value={formData.positionId}
              onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              disabled={positions.length === 0}
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">日付</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-gray-100"
              readOnly
            />
          </div>
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">開始時刻</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">終了時刻</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <div>
              {type === "edit" && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  削除
                </button>
              )}
            </div>
            <div className="flex justify-end gap-3 items-center">
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
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 