"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Position, Shift, ShiftStatus, User } from "@prisma/client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ShiftEditModal from "@/components/ShiftEditModal";

type ShiftWithRelations = Shift & {
  user: { name: string | null };
  position: { name: string | null };
};

const ShiftsTable = ({ shifts, onEdit, onDelete }: { shifts: ShiftWithRelations[], onEdit: (shift: ShiftWithRelations) => void, onDelete: (shiftId: string) => void }) => (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full leading-normal">
        <thead>
          <tr>
            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">従業員</th>
            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">日付</th>
            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">時間</th>
            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">役職</th>
            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">アクション</th>
          </tr>
        </thead>
        <tbody>
          {shifts.length > 0 ? shifts.map((shift) => (
            <tr key={shift.id}>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{shift.user.name}</td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{format(new Date(shift.date), 'yyyy年MM月dd日(EEEE)', { locale: ja })}</td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{shift.startTime} - {shift.endTime}</td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{shift.position.name}</td>
              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm flex gap-2">
                <button onClick={() => onEdit(shift)} className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">編集</button>
                <button onClick={() => onDelete(shift.id)} className="px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700">削除</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={5} className="text-center py-10 text-gray-500">シフトは見つかりませんでした。</td></tr>
          )}
        </tbody>
      </table>
    </div>
);


export default function ShiftsManagementPage() {
  const [draftShifts, setDraftShifts] = useState<ShiftWithRelations[]>([]);
  const [confirmedShifts, setConfirmedShifts] = useState<ShiftWithRelations[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'draft' | 'confirmed'>('draft');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftWithRelations | null>(null);

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const [draftRes, confirmedRes, positionsRes, employeesRes] = await Promise.all([
        fetch(`/api/admin/shifts?status=${ShiftStatus.DRAFT}`),
        fetch(`/api/admin/shifts?status=${ShiftStatus.CONFIRMED}`),
        fetch("/api/positions"),
        fetch("/api/admin/employees"),
      ]);
      if (!draftRes.ok || !confirmedRes.ok || !positionsRes.ok || !employeesRes.ok) throw new Error("データの取得に失敗しました。");
      
      const draftData: ShiftWithRelations[] = await draftRes.json();
      const confirmedData: ShiftWithRelations[] = await confirmedRes.json();
      const positionsData = await positionsRes.json();
      const employeesData: User[] = await employeesRes.json();

      setDraftShifts(draftData);
      setConfirmedShifts(confirmedData);
      setPositions(positionsData);
      setEmployees(employeesData);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleFinalizeShifts = async () => {
    if (!confirm(`${draftShifts.length}件のシフト案を確定しますか？この操作は元に戻せません。`)) return;
    try {
      const res = await fetch('/api/admin/shifts/finalize', { method: 'POST' });
      if (!res.ok) throw new Error('シフトの確定に失敗しました。');
      const result = await res.json();
      toast.success(`${result.count}件のシフトを確定しました。`);
      await fetchShifts();
      setActiveTab('confirmed');
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    }
  };

  const handleEditClick = (shift: ShiftWithRelations) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShift(null);
  };

  const handleUpdateShift = async (updatedData: Partial<Shift>) => {
    if (!selectedShift) return;
    try {
      const res = await fetch(`/api/admin/shifts/${selectedShift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw new Error('シフトの更新に失敗しました。');
      toast.success("シフトが正常に更新されました！");
      handleCloseModal();
      await fetchShifts();
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm("このシフトを削除してもよろしいですか？")) return;
    try {
      const res = await fetch(`/api/admin/shifts/${shiftId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("シフトの削除に失敗しました。");
      toast.success("シフトが正常に削除されました。");
      await fetchShifts();
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <ShiftEditModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={async () => { /* このページでは新規作成は行いません */ }} 
        onUpdate={handleUpdateShift} 
        shift={selectedShift} 
        positions={positions} 
        employees={employees} 
        isCreating={false} 
      />
      
      <h1 className="text-2xl font-bold mb-4">シフト管理</h1>

      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('draft')} className={`${activeTab === 'draft' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            シフト案 ({draftShifts.length})
          </button>
          <button onClick={() => setActiveTab('confirmed')} className={`${activeTab === 'confirmed' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            確定シフト ({confirmedShifts.length})
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="text-center p-10">読み込み中...</div>
      ) : (
        <div>
          {activeTab === 'draft' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">シフト案一覧</h2>
                <button onClick={handleFinalizeShifts} disabled={draftShifts.length === 0} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                  すべてのシフト案を確定する
                </button>
              </div>
              <ShiftsTable shifts={draftShifts} onEdit={handleEditClick} onDelete={handleDeleteShift} />
            </div>
          )}
          {activeTab === 'confirmed' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">確定シフト一覧</h2>
              <ShiftsTable shifts={confirmedShifts} onEdit={handleEditClick} onDelete={handleDeleteShift} />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 