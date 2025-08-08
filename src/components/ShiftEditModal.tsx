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
    employeeId: "",
  });

  useEffect(() => {
    if (isCreating) {
      setFormData({
        date: "",
        startTime: "",
        endTime: "",
        positionId: "",
        employeeId: "",
      });
    } else if (shift) {
      const dateString = new Date(shift.date).toISOString().split("T")[0];

      setFormData({
        date: dateString,
        startTime: shift.startTime,
        endTime: shift.endTime,
        positionId: shift.positionId || "",
        employeeId: shift.userId || "",
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
      date: formData.date,
    };

    if (isCreating) {
      onSave(dataToSend, true);
    } else {
      onUpdate(dataToSend);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isCreating ? "新規シフトを作成" : "シフトを編集"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {isCreating && (
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                従業員 <span className="text-red-500">*</span>
              </label>
              <select
                id="employeeId"
                name="employeeId"
                value={formData.employeeId || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
              >
                <option value="">従業員を選択してください</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              日付 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                開始時刻 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                終了時刻 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="positionId" className="block text-sm font-medium text-gray-700 mb-2">
              役職 <span className="text-red-500">*</span>
            </label>
            <select
              id="positionId"
              name="positionId"
              value={formData.positionId || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
          
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {isCreating ? "シフトを作成" : "シフトを更新"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 