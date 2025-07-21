"use client";

import { useState, useEffect } from "react";
import { User, Position } from "@prisma/client";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// For simplicity, modals are in the same file. In a real app, extract them.

// ADD EMPLOYEE MODAL
interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Omit<User, 'id' | 'role' | 'createdAt'> & { positionIds: string[] }) => Promise<void>;
    positions: Position[];
}

const AddEmployeeModal = ({ isOpen, onClose, onAdd, positions }: AddEmployeeModalProps) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handlePositionChange = (positionId: string) => {
        setSelectedPositions(prev => 
            prev.includes(positionId) 
            ? prev.filter(id => id !== positionId) 
            : [...prev, positionId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onAdd({ name, email, password, positionIds: selectedPositions });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
      if(!isOpen) {
        setName(''); setEmail(''); setPassword(''); setSelectedPositions([]);
      }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">新しい従業員を追加</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">氏名</label>
                        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">割り当て可能な役職</label>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            {positions.map(p => (
                                <label key={p.id} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={selectedPositions.includes(p.id)} onChange={() => handlePositionChange(p.id)} className="rounded"/>
                                    <span>{p.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">キャンセル</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                            {isLoading ? '追加中...' : '従業員を追加'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// EDIT POSITIONS MODAL
type EmployeeWithPositions = User & { positions: Position[] };

interface EditPositionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (employeeId: string, positionIds: string[]) => Promise<void>;
    employee: EmployeeWithPositions | null;
    allPositions: Position[];
}

const EditPositionsModal = ({ isOpen, onClose, onUpdate, employee, allPositions }: EditPositionsModalProps) => {
    const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (employee) {
            setSelectedPositionIds(employee.positions.map(p => p.id));
        }
    }, [employee]);

    if (!isOpen || !employee) return null;

    const handlePositionChange = (positionId: string) => {
        setSelectedPositionIds(prev =>
            prev.includes(positionId)
                ? prev.filter(id => id !== positionId)
                : [...prev, positionId]
        );
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await onUpdate(employee.id, selectedPositionIds);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-2">{employee.name}の役職を編集</h2>
                <p className="text-lg text-gray-600 mb-6">{employee.name}の割り当て可能な役職を選択してください。</p>
                <div className="space-y-2">
                    {allPositions.map(p => (
                        <label key={p.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                            <input type="checkbox" checked={selectedPositionIds.includes(p.id)} onChange={() => handlePositionChange(p.id)} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-gray-800">{p.name}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">キャンセル</button>
                    <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                        {isLoading ? '保存中...' : '変更を保存'}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function EmployeesPage() {
    const [employees, setEmployees] = useState<EmployeeWithPositions[]>([]);
    const [allPositions, setAllPositions] = useState<Position[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithPositions | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [empRes, posRes] = await Promise.all([
                fetch('/api/admin/employees'),
                fetch('/api/admin/positions')
            ]);
            if (!empRes.ok || !posRes.ok) throw new Error("データの取得に失敗しました");
            const empData = await empRes.json();
            const posData = await posRes.json();
            setEmployees(empData);
            setAllPositions(posData);
        } catch (error: any) {
            toast.error(`エラー: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddEmployee = async (data: Omit<User, 'id' | 'role' | 'createdAt'> & { positionIds: string[] }) => {
        try {
            const res = await fetch('/api/admin/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || '従業員の追加に失敗しました');
            }
            toast.success("従業員が正常に追加されました！");
            await fetchData();
            setIsAddModalOpen(false);
        } catch (error: any) {
            toast.error(`エラー: ${error.message}`);
            throw error;
        }
    };

    const handleUpdateEmployeePositions = async (employeeId: string, positionIds: string[]) => {
        try {
            const res = await fetch(`/api/admin/employees/${employeeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ positionIds }),
            });
            if (!res.ok) throw new Error('役職の更新に失敗しました');
            toast.success("役職が正常に更新されました！");
            await fetchData();
            setIsEditModalOpen(false);
        } catch (error: any) {
            toast.error(`エラー: ${error.message}`);
        }
    };

    const handleOpenEditModal = (employee: EmployeeWithPositions) => {
        setSelectedEmployee(employee);
        setIsEditModalOpen(true);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <ToastContainer position="top-right" autoClose={3000} />
            <AddEmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddEmployee} positions={allPositions} />
            <EditPositionsModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdate={handleUpdateEmployeePositions} employee={selectedEmployee} allPositions={allPositions}/>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">従業員管理</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                    + 従業員を追加
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">氏名</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">メールアドレス</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">割り当て可能な役職</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">登録日</th>
                             <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 && !isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500">従業員が見つかりませんでした。</td>
                            </tr>
                        ) : (
                            employees.map(employee => (
                                <tr key={employee.id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{employee.name}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{employee.email}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">
                                            {employee.positions.map(p => p.name).join(', ') || 'なし'}
                                        </p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">
                                            {format(new Date(employee.createdAt), 'yyyy年MM月dd日', { locale: ja })}
                                        </p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <button onClick={() => handleOpenEditModal(employee)} className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">役職を編集</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 