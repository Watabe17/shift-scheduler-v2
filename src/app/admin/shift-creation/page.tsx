"use client";

import { useState, useEffect, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths, isSameDay, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Prisma, Position, User, Shift, ShiftRequest as PrismaShiftRequest } from '@prisma/client';
import { toast } from 'react-toastify';
import ShiftEditModal from "@/components/ShiftEditModal";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastContainer } from 'react-toastify';
import DailyShiftCalendar from '@/components/DailyShiftCalendar';

// --- 型定義 ---
type ShiftRequest = PrismaShiftRequest & { user: User, position: Position, shift?: Shift | null };
type FullShift = Shift & { user: User, position: Position, shiftRequestId: string | null };
type RequiredStaffRule = Prisma.RequiredStaffGetPayload<{ include: { position: true } }>;

type ShiftType = {
  name: string;
  time: string;
  class: string;
};

const shiftTypes: { [key: string]: ShiftType } = {
  morning: { name: '朝勤', time: '9:00-13:00', class: 'shift-morning' },
  afternoon: { name: '昼勤', time: '13:00-17:00', class: 'shift-afternoon' },
  evening: { name: '夕勤', time: '17:00-21:00', class: 'shift-evening' },
  night: { name: '夜勤', time: '21:00-1:00', class: 'shift-night' },
  full: { name: '通し', time: '9:00-21:00', class: 'shift-full' },
};

const ItemTypes = { SHIFT_REQUEST: "shift_request" };

// --- ドラッグ可能な申請カードコンポーネント ---
const DraggableShiftRequest = ({ request }: { request: ShiftRequest }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHIFT_REQUEST,
    item: { ...request },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`p-2 my-1 border rounded-md ${
        isDragging ? 'opacity-50 cursor-grabbing' : 'opacity-100 cursor-grab'
      }`}
    >
      <p className="font-semibold text-sm text-gray-800">{request.user.name}</p>
      <p className="text-xs text-gray-600">{request.position.name}</p>
      <p className="text-xs text-gray-500">{request.startTime.slice(0, 5)} - {request.endTime.slice(0, 5)}</p>
    </div>
  );
};

// --- レーンコンポーネント ---
const PositionLane = ({ position, shifts, onDrop, onShiftClick }: { position: Position, shifts: FullShift[], onDrop: (item: ShiftRequest, positionId: string) => void, onShiftClick: (shift: FullShift) => void }) => {
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: ItemTypes.SHIFT_REQUEST,
        drop: (item: ShiftRequest) => onDrop(item, position.id),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    return (
        <div ref={drop as any} className={`p-2 rounded-md transition-colors min-h-[50px] ${isOver && canDrop ? 'bg-green-100' : 'bg-gray-50'}`}>
            <p className="text-xs font-semibold text-gray-500 border-b">{position.name}</p>
            <div className="mt-1 space-y-1">
                {shifts.map(shift => {
                  const type = Object.keys(shiftTypes).find(key => shiftTypes[key].name === shift.position.name); // Simplify this mapping based on your actual position names
                  const shiftClass = type ? shiftTypes[type].class : 'shift-morning'; // Default or handle unmapped positions
                  return (
                    <div key={shift.id} 
                      className={`shift-block ${shiftClass}`}
                      style={{ position: 'relative', width: '90%', left: '5%', height: 'auto', padding: '8px 0'}} // Override position absolute for lane
                      onClick={() => onShiftClick(shift)}
                    >
                      <p className="font-bold">{shift.user.name}</p>
                      <p>{shift.startTime.slice(0,5)} - {shift.endTime.slice(0,5)}</p>
                    </div>
                  );
                })}
            </div>
        </div>
    )
}

// --- シンプルなカレンダーコンポーネント ---
const SimpleCalendar = ({ currentMonth, onMonthChange, shifts, requiredStaff, positions, onDrop, onShiftClick, onFinalize, isFinalizing, onDownloadPdf }: { currentMonth: Date, onMonthChange: (date: Date) => void, shifts: FullShift[], requiredStaff: RequiredStaffRule[], positions: Position[], onDrop: (item: ShiftRequest, date: Date, positionId: string) => void, onShiftClick: (shift: FullShift) => void, onFinalize: () => void, isFinalizing: boolean, onDownloadPdf: () => void }) => {

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const DayCell = ({ day }: { day: Date }) => {
    const shiftsOnDay = shifts.filter(shift => isSameDay(new Date(shift.date), day));
    const dayOfWeek = getDay(day);
    const rulesForDay = requiredStaff.filter(rule => rule.dayOfWeek === dayOfWeek);
    
    const placedStaffCount = shiftsOnDay.reduce((acc, shift) => {
        acc[shift.position.id] = (acc[shift.position.id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const shiftsByPosition = shiftsOnDay.reduce((acc, shift) => {
        (acc[shift.position.id] = acc[shift.position.id] || []).push(shift);
        return acc;
    }, {} as Record<string, FullShift[]>);

    const isCurrentMonth = isSameMonth(day, currentMonth);

    // DayCellのdropはもう使わないが、コンテナとしてのdivは残す
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.SHIFT_REQUEST,
        collect: monitor => ({ isOver: monitor.isOver() }),
    }));


    return (
      <div
        ref={drop as any}
        className={`border p-2 min-h-[160px] flex flex-col ${
          isCurrentMonth ? 'bg-white' : 'bg-gray-100'
        } ${isOver ? 'bg-blue-50' : ''}`} // ドラッグ中に日付全体を薄くハイライト
      >
        <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
          {format(day, 'd')}
        </span>
        </div>
        
        <div className="flex-grow space-y-2 mt-1">
            {/* Staffing Summary */}
            <div className="flex flex-wrap gap-1">
                {rulesForDay.map(rule => {
                    const placed = placedStaffCount[rule.positionId] || 0;
                    const required = rule.count;
                    const isDeficient = placed < required;
                    return (
                    <div key={rule.id} className={`px-1.5 py-0.5 rounded-full text-white text-[10px] ${isDeficient ? 'bg-red-500' : 'bg-green-500'}`}>
                        {rule.position.name}: {placed}/{required}
                    </div>
                    )
                })}
            </div>
            
            {/* Shift Lanes */}
            <div className="space-y-2 mt-2">
            {positions.map(position => (
                <PositionLane 
                    key={position.id}
                    position={position}
                    shifts={shiftsByPosition[position.id] || []}
                    onDrop={(item) => onDrop(item, day, position.id)}
                    onShiftClick={onShiftClick}
                />
          ))}
            </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-2 gap-4">
        <div className="flex items-center gap-2">
            <button onClick={() => onMonthChange(subMonths(currentMonth, 1))} className="px-4 py-2 bg-gray-200 rounded">前月</button>
            <h2 className="text-xl font-bold whitespace-nowrap">{format(currentMonth, 'yyyy年 M月', { locale: ja })}</h2>
            <button onClick={() => onMonthChange(addMonths(currentMonth, 1))} className="px-4 py-2 bg-gray-200 rounded">次月</button>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={onDownloadPdf}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
                PDFダウンロード
            </button>
            <button 
                onClick={onFinalize}
                disabled={isFinalizing}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
                {isFinalizing ? '処理中...' : `${format(currentMonth, 'M月')}のシフトを確定`}
            </button>
          </div>
        </div>
      <div className="grid grid-cols-7 flex-grow">
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div key={day} className="text-center font-bold text-sm py-2 border-b">{day}</div>
        ))}
        {days.map(day => <DayCell key={day.toString()} day={day} />)}
      </div>
    </div>
  );
};

// --- メインページコンポーネント ---
export default function ShiftCreationPage() {
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [shifts, setShifts] = useState<FullShift[]>([]);
  const [requiredStaff, setRequiredStaff] = useState<RequiredStaffRule[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<FullShift | null>(null);
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [font, setFont] = useState<ArrayBuffer | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  
  // フォントを読み込む
  useEffect(() => {
    const loadFont = async () => {
        try {
            const response = await fetch('/fonts/NotoSansJP-Regular.ttf');
            const fontBuffer = await response.arrayBuffer();
            setFont(fontBuffer);
        } catch (error) {
            console.error("Font loading failed:", error);
            toast.error("PDF用のフォントの読み込みに失敗しました。");
        }
    };
    loadFont();
  }, []);

  const fetchAllData = async (year: number, month: number) => {
    try {
      const [requestsRes, shiftsRes, requiredStaffRes, positionsRes, employeesRes] = await Promise.all([
        fetch("/api/admin/shift-requests?status=approved"),
        fetch(`/api/admin/shifts?year=${year}&month=${month}`),
        fetch("/api/admin/required-staff"),
        fetch("/api/admin/positions"),
        fetch("/api/admin/employees"),
      ]);
      if (!requestsRes.ok || !shiftsRes.ok || !requiredStaffRes.ok || !positionsRes.ok || !employeesRes.ok) {
        throw new Error("Failed to fetch data");
      }
      
      const requestsData: ShiftRequest[] = await requestsRes.json();
      const shiftsData: FullShift[] = await shiftsRes.json();
      const requiredStaffData: RequiredStaffRule[] = await requiredStaffRes.json();
      const positionsData: Position[] = await positionsRes.json();
      const employeesData: User[] = await employeesRes.json();

      setRequests(requestsData.filter((r) => !r.shift));
      setShifts(shiftsData);
      setRequiredStaff(requiredStaffData);
      setPositions(positionsData);
      setEmployees(employeesData);

    } catch (error) { 
      console.error(error);
      toast.error("データの取得に失敗しました。");
    }
  };

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    fetchAllData(year, month);
  }, [currentMonth]);

  const handleDropOnCalendar = useCallback(async (request: ShiftRequest, date: Date, positionId: string) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd'T'00:00:00.000'Z'");

      const res = await fetch("/api/admin/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: request.user.id,
          positionId: positionId, // ドロップされたレーンのポジションIDを使用
          date: formattedDate,
          startTime: request.startTime,
          endTime: request.endTime,
          shiftRequestId: request.id,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create shift");
      }
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      await fetchAllData(year, month);
      toast.success("シフトを作成しました");
    } catch (error: any) {
      console.error("Failed to create shift:", error);
      toast.error(`シフト作成失敗: ${error.message}`);
    }
  }, [fetchAllData, currentMonth]);

  const handleShiftClick = (shift: FullShift) => {
    setSelectedShift(shift);
    setIsCreatingShift(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedShift(null);
    setIsCreatingShift(false);
  }, []);

  const handleNewShiftClick = useCallback((date: Date) => {
    setSelectedShift({
      id: '',
      date: date,
      startTime: '09:00',
      endTime: '17:00',
      status: 'DRAFT',
      userId: '',
      positionId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {} as User,
      position: {} as Position,
      shiftRequestId: null,
    });
    setIsCreatingShift(true);
    setIsModalOpen(true);
  }, []);

  const handleSaveShift = async (
    shiftData: Partial<Shift>,
    isNew: boolean
  ) => {
    try {
      const url = isNew ? '/api/admin/shifts' : `/api/admin/shifts/${shiftData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData),
      });
      if (!res.ok) throw new Error(isNew ? 'Failed to create shift.' : 'Failed to update shift.');
      toast.success(isNew ? "Shift successfully created!" : "Shift successfully updated!");
      handleCloseModal();
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      await fetchAllData(year, month);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleUpdateShift = async (updatedData: Partial<Shift>) => {
    await handleSaveShift(updatedData, false);
  };

  const handleDeleteShift = useCallback(async () => {
    if (!selectedShift) return;
    if (!confirm("Are you sure you want to delete this shift?")) return;

    try {
      const res = await fetch(`/api/admin/shifts/${selectedShift.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete shift.");
      }
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      await fetchAllData(year, month);
      toast.success("Shift deleted successfully!");
      handleCloseModal();
    } catch (err: any) {
        toast.error(`Error: ${err.message}`);
    }
  }, [selectedShift, fetchAllData, handleCloseModal, currentMonth]);

  const handleDownloadPdf = async () => {
    if (!font) {
        toast.error("フォントが読み込まれていません。");
        return;
    }

    const doc = new jsPDF();
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
    doc.setFont('NotoSansJP');

    const shiftsForPdf = shifts.map(shift => [
        format(new Date(shift.date), 'yyyy/MM/dd', { locale: ja }),
        shift.user.name || '',
        shift.position.name || '',
        `${shift.startTime.slice(0,5)} - ${shift.endTime.slice(0,5)}`,
        shift.status,
    ]);

    autoTable(doc, {
        head: [['日付', '従業員', '役職', '時間', 'ステータス']],
        body: shiftsForPdf,
        startY: 20,
        headStyles: { font: 'NotoSansJP' },
        bodyStyles: { font: 'NotoSansJP' },
    });

    doc.save(`shifts_${format(currentMonth, 'yyyyMM')}.pdf`);
  };

  const handleFinalizeShifts = async () => {
    if (confirm(`${format(currentMonth, 'yyyy年 M月')}のシフトを確定します。よろしいですか？この操作は元に戻せません。`)) {
      setIsFinalizing(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;

        const res = await fetch('/api/admin/shifts/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year, month }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to finalize shifts');
        }

        const result = await res.json();
        toast.success(result.message || 'シフトを確定しました！');
        await fetchAllData(year, month);
      } catch (err: any) {
        toast.error(`エラー: ${err.message}`);
      } finally {
        setIsFinalizing(false);
      }
    }
    setSelectedShift(null);
  };

  const handleClearDrafts = useCallback(async () => {
    if (confirm("Are you sure you want to clear all draft shifts?")) {
      try {
        const res = await fetch('/api/admin/shifts/clear-drafts', {
          method: 'POST',
        });
        if (!res.ok) {
          throw new Error("Failed to clear drafts");
        }
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        await fetchAllData(year, month);
        toast.success("All draft shifts cleared successfully!");
      } catch (err: any) {
        toast.error(`Error: ${err.message}`);
      }
    }
  }, [fetchAllData, currentMonth]);

  return (
    <DndProvider backend={HTML5Backend}>
      <ToastContainer position="top-right" autoClose={3000} />
      <ShiftEditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveShift}
        onUpdate={handleUpdateShift} // 確実に onUpdate を渡す
        shift={selectedShift}
        positions={positions}
        employees={employees}
        isCreating={isCreatingShift}
      />
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="header bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 text-center sticky top-0 z-50 shadow-lg">
          <h1 className="text-3xl font-bold">シフト作成</h1>
        </div>

        <div className="controls bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
          <div className="date-nav flex items-center gap-2">
            <button className="nav-btn bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>◀ 前月</button>
            <span className="current-date font-bold text-lg">{format(currentMonth, "yyyy年 MMMM", { locale: ja })}</span>
            <button className="nav-btn bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>次月 ▶</button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="nav-btn bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              PDFダウンロード
            </button>
            <button
              onClick={handleFinalizeShifts}
              disabled={isFinalizing}
              className="nav-btn bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isFinalizing ? '処理中...' : `${format(currentMonth, 'M月')}のシフトを確定`}
            </button>
            <button
              onClick={handleClearDrafts}
              className="nav-btn bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              ドラフトシフトをクリア
            </button>
            <button
              onClick={() => handleNewShiftClick(new Date())}
              className="nav-btn bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              新規シフト作成
            </button>
          </div>
        </div>

        <div className="view-toggle bg-white p-2 border-b border-gray-200 flex justify-center gap-4">
          <button 
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-md ${viewMode === 'month' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            月単位
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-md ${viewMode === 'day' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            日単位
          </button>
        </div>

        <div className="flex-grow flex overflow-hidden">
          <div className="w-1/4 p-4 border-r bg-white overflow-y-auto shadow-inner">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">未処理のシフト希望</h2>
            <div className="space-y-2">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <DraggableShiftRequest key={request.id} request={request} />
                ))
              ) : (
                <p className="text-gray-500">未処理のシフト希望はありません。</p>
              )}
            </div>
          </div>

          <div className="flex-grow p-4">
            {viewMode === 'month' ? (
              <SimpleCalendar
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                shifts={shifts}
                requiredStaff={requiredStaff}
                positions={positions}
                onDrop={handleDropOnCalendar}
                onShiftClick={handleShiftClick}
                onFinalize={handleFinalizeShifts}
                isFinalizing={isFinalizing}
                onDownloadPdf={handleDownloadPdf}
              />
            ) : (
              <DailyShiftCalendar
                currentDate={currentMonth}
                onDateChange={setCurrentMonth}
                shifts={shifts}
                employees={employees}
                positions={positions}
                onDrop={handleDropOnCalendar}
                onShiftClick={handleShiftClick}
                onSaveShift={handleSaveShift}
                onDeleteShift={handleDeleteShift}
                onNewShiftClick={handleNewShiftClick}
              />
            )}
          </div>
        </div>

        <div className="legend bg-white p-4 m-4 rounded-lg shadow-md self-end">
          <h3 className="text-lg font-semibold mb-2">シフト種類</h3>
          <div className="legend-item flex items-center gap-2 mb-1">
            <div className="legend-color w-5 h-5 rounded-sm shift-morning"></div>
            <span>朝勤 (9:00-13:00)</span>
          </div>
          <div className="legend-item flex items-center gap-2 mb-1">
            <div className="legend-color w-5 h-5 rounded-sm shift-afternoon"></div>
            <span>昼勤 (13:00-17:00)</span>
          </div>
          <div className="legend-item flex items-center gap-2 mb-1">
            <div className="legend-color w-5 h-5 rounded-sm shift-evening"></div>
            <span>夕勤 (17:00-21:00)</span>
          </div>
          <div className="legend-item flex items-center gap-2 mb-1">
            <div className="legend-color w-5 h-5 rounded-sm shift-night"></div>
            <span>夜勤 (21:00-1:00)</span>
          </div>
          <div className="legend-item flex items-center gap-2 mb-1">
            <div className="legend-color w-5 h-5 rounded-sm shift-full"></div>
            <span>通し (9:00-21:00)</span>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
