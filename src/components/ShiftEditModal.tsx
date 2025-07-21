"use client";

import { useState, useEffect } from "react";
import { Position, Shift, User } from "@prisma/client";

type ShiftData = Partial<Omit<Shift, 'createdAt' | 'updatedAt'>>;

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shiftData: ShiftData, isNew: boolean) => void;
  onUpdate: (updatedData: Partial<Shift>) => Promise<void>;
  shift?: Shift | null;
  positions: Position[];
  employees: User[];
  isCreating: boolean;
}

export default function ShiftEditModal({ isOpen, onClose, onSave, onUpdate, shift, positions, employees, isCreating }: ShiftEditModalProps) {
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    positionId: "",
    userId: "",
  });

  useEffect(() => {
    if (isCreating) {
      setFormData({
        date: "",
        startTime: "",
        endTime: "",
        positionId: "",
        userId: "",
      });
    } else if (shift) {
      const dateString = new Date(shift.date).toISOString().split("T")[0];

      setFormData({
        date: dateString,
        startTime: shift.startTime,
        endTime: shift.endTime,
        positionId: shift.positionId,
        userId: shift.userId,
      });
    }
  }, [shift, isCreating]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = {
      id: isCreating ? undefined : shift?.id,
      ...formData,
      date: new Date(formData.date),
    };

    if (isCreating) {
      onSave(dataToSend, true);
    } else {
      onUpdate(dataToSend);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{isCreating ? "新規シフトを作成" : "シフトを編集"}</h2>
        <form onSubmit={handleSubmit}>
          {isCreating && (
            <div className="mb-4">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">従業員</label>
              <select
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">従業員を選択してください</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">開始時刻</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">終了時刻</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="positionId" className="block text-sm font-medium text-gray-700 mb-1">役職</label>
            <select
              id="positionId"
              name="positionId"
              value={formData.positionId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">役職を選択してください</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isCreating ? "シフトを作成" : "シフトを更新"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 