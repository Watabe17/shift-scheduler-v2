"use client";

import { useState, useEffect, FormEvent } from "react";
import { Position, RequiredStaff } from "@prisma/client";
import RequiredStaffManager from "@/components/RequiredStaffManager";
import { toast } from "react-toastify";

interface PositionWithStaff extends Position {
  requiredStaffs: RequiredStaff[];
}

// 新しく追加：ポジションごとのアイテムコンポーネント
const PositionItem = ({ position, onUpdate, onDelete }: { position: PositionWithStaff, onUpdate: (id: string, name: string) => Promise<void>, onDelete: (id: string) => Promise<void> }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(position.name);

  const handleSave = async () => {
    if (name.trim() === "" || name === position.name) {
      setIsEditing(false);
      setName(position.name);
      return;
    }
    await onUpdate(position.id, name);
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none"
            autoFocus
          />
        ) : (
          <h3 className="text-xl font-bold text-gray-800">{position.name}</h3>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditing(!isEditing)} className="text-sm text-blue-600 hover:text-blue-800">
            {isEditing ? "キャンセル" : "編集"}
          </button>
          <button onClick={() => onDelete(position.id)} className="text-sm text-red-600 hover:text-red-800">
            削除
          </button>
        </div>
      </div>
      <RequiredStaffManager position={position} onUpdate={onUpdate as any} />
    </div>
  )
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<PositionWithStaff[]>([]);
  const [newPositionName, setNewPositionName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async () => {
    try {
      const res = await fetch("/api/admin/positions");
      if (!res.ok) throw new Error("ポジションの取得に失敗しました");
      const data: PositionWithStaff[] = await res.json();
      setPositions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleCreatePosition = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPositionName.trim()) return;

    try {
      const res = await fetch("/api/admin/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPositionName }),
      });

      if (!res.ok) throw new Error("ポジションの作成に失敗しました");
      
      toast.success(`「${newPositionName}」を作成しました。`);
      setNewPositionName("");
      await fetchPositions();
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    }
  };

  const handleUpdatePosition = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/positions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if(!res.ok) throw new Error("ポジション名の更新に失敗しました。");
      toast.success("ポジション名を更新しました。");
      await fetchPositions();
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    }
  };

  const handleDeletePosition = async (id: string) => {
    if(!confirm("このポジションを削除しますか？\n関連する全ての必要人数ルールも削除されます。")) return;
    try {
      const res = await fetch(`/api/admin/positions/${id}`, {
        method: 'DELETE',
      });
      if(!res.ok) throw new Error("ポジションの削除に失敗しました。");
      toast.success("ポジションを削除しました。");
      await fetchPositions();
    } catch (err: any) {
      toast.error(`エラー: ${err.message}`);
    }
  }
  
  if (isLoading) return <div className="p-4 animate-pulse">ポジションを読み込み中...</div>;
  if (error) return <div className="p-4 text-red-500">エラー: {error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">役職管理</h1>

      <div className="mb-8 max-w-md bg-white p-4 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-3">新しい役職を作成</h2>
        <form onSubmit={handleCreatePosition} className="flex gap-2">
          <input
            type="text"
            value={newPositionName}
            onChange={(e) => setNewPositionName(e.target.value)}
            placeholder="例: ホール、キッチン"
            className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
          >
            作成
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {positions.map(position => (
          <PositionItem 
            key={position.id} 
            position={position}
            onUpdate={handleUpdatePosition}
            onDelete={handleDeletePosition}
          />
        ))}
      </div>
    </div>
  );
} 