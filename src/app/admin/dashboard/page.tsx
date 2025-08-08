"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useSession } from "next-auth/react";
import Link from "next/link";

// 絵文字アイコンコンポーネント
const CalendarDaysIcon = ({ className }: { className?: string }) => (
  <span className={className}>📅</span>
);

const UserIcon = ({ className }: { className?: string }) => (
  <span className={className}>👤</span>
);

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Shift {
  id: string;
  employeeId: string;
  startTime: number; // 15分単位のスロット (0 = 9:00, 4 = 10:00, etc.)
  duration: number;  // 15分単位のスロット数
  role: string;
}

export default function ShiftManagementPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day'>('day'); // デフォルトを日表示に
  const [activeTab, setActiveTab] = useState<'staff' | 'role'>('staff');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(0);
  
  // ドラッグ関連の状態（改善版）
  const [dragState, setDragState] = useState({
    isDragging: false,
    shiftId: null as string | null,
    dragType: null as 'move' | 'resize-left' | 'resize-right' | null,
    startX: 0,
    originalStartTime: 0,
    originalDuration: 0
  });
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const timeSlots = Array.from({ length: 52 }, (_, i) => i); // 9:00-22:00 (13時間、15分単位)

  // ビューポートの幅に基づいてセル幅を動的に計算（プレミアムデザイン対応）
  const calculateCellWidth = () => {
    if (viewportWidth === 0) return 65; // デフォルト値をさらに大きく
    
    // 左サイドバー(96px) + パディング(32px) + 従業員名列(160px) + マージン(32px) を除いた利用可能幅
    const availableWidth = viewportWidth - 96 - 32 - 160 - 32;
    const timeColumns = 13; // 9:00-22:00 (13時間)
    
    // 15分単位のセル数 (13時間 × 4 = 52セル)
    const totalCells = timeColumns * 4;
    
    // 利用可能幅をセル数で割って、最小幅を保証（プレミアムサイズ）
    const calculatedWidth = Math.max(55, availableWidth / totalCells);
    
    return Math.floor(calculatedWidth);
  };

  const cellWidth = calculateCellWidth();

  // ビューポートの幅を監視
  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    
    return () => {
      window.removeEventListener('resize', updateViewportWidth);
    };
  }, []);

  // 時間フォーマット関数（15分単位）- 改善版
  const formatTime = (timeSlot: number) => {
    const hour = Math.floor(timeSlot / 4) + 9;
    const minute = (timeSlot % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // マウス位置を取得（改善版）
  const getMousePosition = (e: MouseEvent) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return e.clientX - rect.left;
  };

  // 15分単位でのスナップ機能を強化
  const snapToQuarterHour = (timeSlot: number) => {
    return Math.round(timeSlot / 4) * 4; // 1時間単位でスナップ
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/admin/employees');
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
          
          // 仮のシフトデータを生成（より現実的な配置）
          const mockShifts: Shift[] = data.map((employee: Employee, index: number) => ({
            id: `shift-${employee.id}`,
            employeeId: employee.id,
            startTime: (9 + (index % 6)) * 4, // 9:00, 10:00, 11:00, 12:00, 13:00, 14:00
            duration: 16 + (index % 4) * 4, // 4-8時間のバリエーション
            role: ['キッチン', 'ホール', 'レジ', '経理'][index % 4]
          }));
          setShifts(mockShifts);
        } else {
          console.error('従業員データの取得に失敗しました');
        }
      } catch (error) {
        console.error('従業員データの取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleDateChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  // シフトの位置と幅を計算（改善版 - より視覚的に美しく）
  const getShiftStyle = (shift: Shift) => {
    const startPos = Math.max(0, shift.startTime / 4 * cellWidth);
    const width = Math.max(cellWidth * 0.95, shift.duration / 4 * cellWidth - 2); // 少し余白を追加
    
    const roleColors: { [key: string]: string } = {
      'キッチン': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      'ホール': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      'レジ': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      '経理': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'default': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
    };
    
    return {
      left: `${startPos + 1}px`, // 1px オフセット
      width: `${width}px`,
      position: 'absolute' as const,
      height: '32px',
      background: roleColors[shift.role] || roleColors.default,
      borderRadius: '8px',
      boxShadow: dragState.shiftId === shift.id 
        ? '0 8px 25px rgba(0,0,0,0.25)' 
        : '0 3px 10px rgba(0,0,0,0.15)',
      cursor: 'move',
      userSelect: 'none' as const,
      zIndex: dragState.shiftId === shift.id ? 20 : 10,
      top: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: Math.max(11, Math.min(14, cellWidth / 3)),
      fontWeight: '600',
      minWidth: `${cellWidth * 0.9}px`,
      border: '1px solid rgba(255, 255, 255, 0.3)',
      transition: dragState.shiftId === shift.id ? 'none' : 'all 0.2s ease',
      transform: dragState.shiftId === shift.id ? 'scale(1.02)' : 'scale(1)', // ドラッグ時に少し拡大
    };
  };

  // 新しいシフトを作成（改善版）
  const createNewShift = (employeeId: string, timeSlot: number) => {
    const snappedTimeSlot = snapToQuarterHour(timeSlot);
    const employee = employees.find(emp => emp.id === employeeId);
    
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      employeeId,
      startTime: snappedTimeSlot,
      duration: 16, // デフォルト4時間
      role: employee?.role || 'キッチン'
    };
    setShifts(prev => [...prev, newShift]);
  };

  // セルクリックでシフト作成（重複チェック改善）
  const handleCellClick = (employeeId: string, timeSlot: number) => {
    const clickedTime = timeSlot * 4;
    const existingShift = shifts.find(shift => 
      shift.employeeId === employeeId && 
      shift.startTime <= clickedTime && 
      shift.startTime + shift.duration > clickedTime
    );
    
    if (!existingShift && !dragState.isDragging) {
      createNewShift(employeeId, clickedTime);
    }
  };

  // シフト削除（アニメーション付き）
  const deleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(shift => shift.id !== shiftId));
  };

  // マウスダウンイベント（ドラッグ開始）- 改善版
  const handleMouseDown = (e: React.MouseEvent, shift: Shift, type: 'move' | 'resize-left' | 'resize-right' = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    
    setDragState({
      isDragging: true,
      shiftId: shift.id,
      dragType: type,
      startX: mouseX,
      originalStartTime: shift.startTime,
      originalDuration: shift.duration
    });
  };

  // マウス移動イベント（ドラッグ中）- 15分単位スナップ強化
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.shiftId) return;

    const currentX = getMousePosition(e);
    const deltaX = currentX - dragState.startX;
    const deltaTimeSlots = Math.round(deltaX / (cellWidth / 4)) * 1; // 15分単位でスナップ

      setShifts(prevShifts => 
        prevShifts.map(shift => {
        if (shift.id !== dragState.shiftId) return shift;

        let newStartTime = dragState.originalStartTime;
        let newDuration = dragState.originalDuration;

        switch (dragState.dragType) {
          case 'move':
            newStartTime = Math.max(0, Math.min(51, dragState.originalStartTime + deltaTimeSlots));
            break;
          case 'resize-left':
            const leftChange = deltaTimeSlots;
            newStartTime = Math.max(0, Math.min(
              dragState.originalStartTime + dragState.originalDuration - 4, 
              dragState.originalStartTime + leftChange
            ));
            newDuration = Math.max(4, dragState.originalDuration - leftChange);
            break;
          case 'resize-right':
            newDuration = Math.max(4, Math.min(
              52 - dragState.originalStartTime, 
              dragState.originalDuration + deltaTimeSlots
            ));
            break;
          }

          return {
            ...shift,
          startTime: newStartTime,
          duration: newDuration
          };
        })
      );
  }, [dragState, cellWidth]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      shiftId: null,
      dragType: null,
      startX: 0,
      originalStartTime: 0,
      originalDuration: 0
    });
  }, []);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // 時間セルのクリックハンドラー（改善版）
  const handleTimeCellClick = (employeeId: string, timeSlot: number) => {
    if (dragState.isDragging) return; // ドラッグ中はクリックを無効
    handleCellClick(employeeId, timeSlot);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 左側サイドバー - プレミアムデザイン */}
      <div className="w-24 bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600 flex flex-col items-center py-8 shadow-2xl relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        
        {/* ロゴエリア */}
        <div className="w-14 h-14 mb-8 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
            <div className="w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded"></div>
          </div>
        </div>
        
        {/* ナビゲーションアイテム */}
        <div 
          className={`group w-14 h-14 mb-6 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-500 transform relative overflow-hidden ${
            viewMode === 'month' 
              ? 'bg-white/30 text-white shadow-2xl scale-110 translate-x-1' 
              : 'bg-white/10 text-white/80 hover:bg-white/20 hover:scale-105 hover:shadow-xl'
          }`}
          onClick={() => setViewMode('month')}
          title="月間シフト管理"
        >
          {/* ホバー時の光る効果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 relative z-10 drop-shadow-lg">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
            <path d="M7 10h5v5H7z"/>
            <path d="M14 10h3v2h-3z"/>
            <path d="M14 13h3v2h-3z"/>
          </svg>
          
          {/* アクティブ時のインジケーター */}
          {viewMode === 'month' && (
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-white rounded-full shadow-lg animate-pulse"></div>
          )}
        </div>
        
        <div 
          className={`group w-14 h-14 mb-6 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-500 transform relative overflow-hidden ${
            viewMode === 'day' 
              ? 'bg-white/30 text-white shadow-2xl scale-110 translate-x-1' 
              : 'bg-white/10 text-white/80 hover:bg-white/20 hover:scale-105 hover:shadow-xl'
          }`}
          onClick={() => setViewMode('day')}
          title="日別シフト管理"
        >
          {/* ホバー時の光る効果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 relative z-10 drop-shadow-lg">
            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
          </svg>
          
          {/* アクティブ時のインジケーター */}
          {viewMode === 'day' && (
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-8 bg-white rounded-full shadow-lg animate-pulse"></div>
          )}
        </div>
        
        <div 
          className="group w-14 h-14 mb-6 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-500 transform relative overflow-hidden bg-white/10 text-white/80 hover:bg-white/20 hover:scale-105 hover:shadow-xl"
          title="シフト設定"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 relative z-10 drop-shadow-lg">
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
          </svg>
        </div>
        
        <div 
          className="group w-14 h-14 mb-6 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-500 transform relative overflow-hidden bg-white/10 text-white/80 hover:bg-white/20 hover:scale-105 hover:shadow-xl"
          title="従業員管理"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 relative z-10 drop-shadow-lg">
            <path d="M16 8c0 2.21-1.79 4-4 4s-4-1.79-4-4s1.79-4 4-4s4 1.79 4 4zM12 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
          </svg>
        </div>
        
        {/* 底部の装飾 */}
        <div className="mt-auto w-12 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"></div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
        {/* 上部ヘッダー - プレミアムデザイン */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-8 py-6 flex justify-between items-center shadow-xl relative overflow-hidden">
          {/* 背景装飾 */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <CalendarDaysIcon className="text-2xl" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-wide">
                  {viewMode === 'month' ? 'シフト管理 月間表示' : 'シフト管理 日別表示'}
                </div>
                <div className="text-white/80 text-sm font-medium">
                  {format(currentDate, 'yyyy年M月d日（E）', { locale: ja })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex items-center gap-3 bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg">
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-white font-medium">
              {session?.user?.name || 'ユーザー'}
              </div>
            </div>
            <Link 
              href="/logout" 
              className="bg-red-500/90 hover:bg-red-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm border border-red-400/30"
            >
              ログアウト
            </Link>
          </div>
        </div>

        {/* 店舗情報バー */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-8 py-4 border-b border-slate-300/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
            <div className="text-slate-700 font-semibold tracking-wide">DINING PREMIUM RESTAURANT</div>
            <div className="text-slate-500 text-sm">• リアルタイム更新中</div>
          </div>
        </div>

        {/* シフト管理エリア - プレミアムデザイン */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm m-4 rounded-2xl shadow-2xl overflow-hidden border border-white/50">
          <div className="p-6 border-b border-gradient-to-r from-slate-200 to-slate-300 bg-gradient-to-r from-slate-50 to-slate-100 flex justify-between items-center">
            <div className="flex bg-white rounded-2xl p-1 shadow-lg border border-slate-200">
              <button 
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-400 ${
                  activeTab === 'staff' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl transform scale-105' 
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
                onClick={() => setActiveTab('staff')}
              >
                👥 スタッフ別
              </button>
              <button 
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-400 ${
                  activeTab === 'role' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl transform scale-105' 
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
                onClick={() => setActiveTab('role')}
              >
                🏷️ 役割別
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button 
                className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-110 border border-indigo-400/30"
                onClick={() => handleDateChange('prev')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div className="bg-white px-6 py-3 rounded-2xl shadow-lg border border-slate-200">
                <span className="text-slate-700 font-bold text-lg tracking-wide">
                {format(currentDate, 'yyyy/MM月dd日 (EEEE)', { locale: ja })}
                </span>
              </div>
              <button 
                className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-110 border border-indigo-400/30"
                onClick={() => handleDateChange('next')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
              <button 
                className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-110 border border-green-400/30"
                title="カレンダー表示"
              >
                <CalendarDaysIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* スケジュールグリッド */}
          <div className="overflow-x-auto">
            <div ref={gridRef} className="relative" style={{ minWidth: `${cellWidth * 52}px` }}>
              {/* 時間ヘッダー - 改善版 */}
              <div className="flex border-b bg-gray-50 sticky top-0 z-30">
                <div className="w-40 flex-shrink-0 border-r bg-gray-100"></div>
                {Array.from({ length: 13 }, (_, i) => i + 9).map(hour => (
                  <div key={hour} className="relative" style={{ width: `${cellWidth * 4}px` }}>
                    <div className="text-center text-sm font-semibold py-3 border-r bg-gradient-to-b from-gray-50 to-gray-100">
                      {hour}:00
                    </div>
                    {/* 15分刻みの補助線 */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  </div>
                ))}
              </div>

              {activeTab === 'staff' ? (
                // スタッフ別表示
                      employees.map((employee) => {
                        const employeeShifts = shifts.filter(shift => shift.employeeId === employee.id);
                        
                        return (
                    <div key={employee.id} className="border-b hover:bg-gray-50 transition-colors">
                      {/* 従業員ヘッダー */}
                      <div className="flex">
                        <div className="w-40 flex-shrink-0 bg-gray-50 px-3 py-3 border-r text-sm font-medium flex items-center">
                          <div>
                            <div className="font-semibold">{employee.name}</div>
                            <div className="text-xs text-gray-500">{employee.role}</div>
                          </div>
                        </div>
                        <div className="flex-1 relative" style={{ height: '48px' }}>
                          {/* グリッド線とクリック可能エリア */}
                          {timeSlots.map((slot, index) => (
                            <div 
                              key={index}
                              className="absolute border-r h-full hover:bg-blue-50 cursor-pointer transition-colors"
                              style={{ 
                                left: `${slot * (cellWidth / 4)}px`, 
                                width: `${cellWidth / 4}px`,
                                borderColor: slot % 4 === 0 ? '#d1d5db' : '#f3f4f6'
                              }}
                              onClick={() => handleTimeCellClick(employee.id, slot)}
                              title={`${formatTime(slot)} にシフトを追加`}
                            />
                          ))}
                          
                          {/* シフトバー */}
                          {employeeShifts.map(shift => (
                                    <div
                                      key={shift.id}
                              className="absolute flex items-center text-xs text-white font-medium rounded cursor-move select-none hover:shadow-xl transition-all duration-200"
                                      style={getShiftStyle(shift)}
                              onMouseDown={(e) => handleMouseDown(e, shift, 'move')}
                              title={`${formatTime(shift.startTime)} - ${formatTime(shift.startTime + shift.duration)}`}
                                    >
                              {/* 左端のリサイズハンドル */}
                                      <div
                                className="absolute left-0 top-0 w-3 h-full cursor-ew-resize bg-black bg-opacity-20 hover:bg-opacity-40 transition-opacity rounded-l-lg"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          handleMouseDown(e, shift, 'resize-left');
                                        }}
                                title="開始時間を調整"
                              />
                              
                              {/* シフト名 */}
                              <div className="flex-1 text-center px-3 truncate">
                                {employee.name}
                              </div>
                              
                              {/* 右端のリサイズハンドル */}
                              <div
                                className="absolute right-0 top-0 w-3 h-full cursor-ew-resize bg-black bg-opacity-20 hover:bg-opacity-40 transition-opacity rounded-r-lg"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          handleMouseDown(e, shift, 'resize-right');
                                        }}
                                title="終了時間を調整"
                              />
                                    </div>
                                  ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // 役割別表示
                ['キッチン', 'ホール', 'レジ', '経理'].map((role) => (
                  <div key={role} className="border-b">
                    {/* 役割ヘッダー */}
                    <div className="flex">
                      <div className="w-40 flex-shrink-0 bg-gray-50 px-3 py-3 border-r text-sm font-semibold">
                        {role}
                      </div>
                      <div className="flex-1 relative" style={{ height: '48px' }}>
                        {/* グリッド線 */}
                        {timeSlots.map((slot, index) => (
                          <div 
                            key={index}
                            className="absolute border-r h-full"
                            style={{ 
                              left: `${slot * (cellWidth / 4)}px`, 
                              width: '1px',
                              borderColor: slot % 4 === 0 ? '#d1d5db' : '#f3f4f6'
                            }}
                          />
                        ))}
                        
                        {/* シフトバー */}
                        {shifts
                          .filter(shift => shift.role === role)
                          .map(shift => {
                            const employee = employees.find(emp => emp.id === shift.employeeId);
                            return (
                          <div
                            key={shift.id}
                                className="absolute flex items-center text-xs text-white font-medium rounded cursor-move select-none hover:shadow-xl transition-all duration-200"
                            style={getShiftStyle(shift)}
                                onMouseDown={(e) => handleMouseDown(e, shift, 'move')}
                                title={`${employee?.name}: ${formatTime(shift.startTime)} - ${formatTime(shift.startTime + shift.duration)}`}
                          >
                                {/* リサイズハンドル */}
                            <div
                                  className="absolute left-0 top-0 w-3 h-full cursor-ew-resize bg-black bg-opacity-20 hover:bg-opacity-40 transition-opacity rounded-l-lg"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleMouseDown(e, shift, 'resize-left');
                              }}
                            />
                                
                                <div className="flex-1 text-center px-3 truncate">
                                  {employee?.name || '従業員'}
                                </div>
                                
                            <div
                                  className="absolute right-0 top-0 w-3 h-full cursor-ew-resize bg-black bg-opacity-20 hover:bg-opacity-40 transition-opacity rounded-r-lg"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleMouseDown(e, shift, 'resize-right');
                              }}
                            />
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* 必要人数・過不足行 */}
                    <div className="flex text-xs text-gray-600">
                      <div className="w-40 flex-shrink-0 px-3 py-2 border-r bg-gray-50 font-medium">必要人数</div>
                      <div className="flex-1 py-2 bg-yellow-50"></div>
                    </div>
                    <div className="flex text-xs text-gray-600 border-b">
                      <div className="w-40 flex-shrink-0 px-3 py-2 border-r bg-gray-50 font-medium">過不足</div>
                      <div className="flex-1 py-2 bg-red-50"></div>
                            </div>
                          </div>
                ))
              )}
                           </div>
                         </div>

          {/* リアルタイムシフト情報表示 - プレミアムデザイン */}
          <div className="p-6 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-wide">現在のシフト状況 (9:00-22:00)</h3>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-indigo-200 to-transparent"></div>
            </div>
            {shifts.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl shadow-lg border border-slate-200">
                <div className="text-6xl mb-4">🕐</div>
                <p className="text-slate-600 font-semibold text-lg">シフトが登録されていません</p>
                <p className="text-slate-400 text-sm mt-2">時間セルをクリックしてシフトを追加してください</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-48 overflow-y-auto">
                {shifts
                  .sort((a, b) => a.startTime - b.startTime)
                  .map(shift => {
                    const employee = employees.find(emp => emp.id === shift.employeeId);
                    const duration = shift.duration / 4; // 時間に変換
                    return (
                      <div key={shift.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-4 h-4 rounded-full shadow-lg animate-pulse"
                            style={{ 
                              background: {
                                'キッチン': 'linear-gradient(135deg, #ef4444, #dc2626)',
                                'ホール': 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                'レジ': 'linear-gradient(135deg, #10b981, #059669)',
                                '経理': 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                              }[shift.role] || 'linear-gradient(135deg, #6b7280, #4b5563)'
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-lg">{employee?.name || '従業員'}</span>
                            <span className="bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 text-xs px-3 py-1 rounded-full font-medium">
                              {shift.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold px-4 py-2 rounded-xl shadow-md">
                              {formatTime(shift.startTime)} - {formatTime(shift.startTime + shift.duration)}
                            </span>
                            <span className="text-slate-500 text-sm font-medium bg-slate-100 px-3 py-1 rounded-lg">
                              {duration}時間
                            </span>
                          </div>
                        </div>
                        <button
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm px-4 py-2 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                          onClick={() => deleteShift(shift.id)}
                          title="シフトを削除"
                        >
                          🗑️ 削除
                        </button>
                          </div>
                    );
                  })}
                        </div>
            )}
      </div>
    </div>
  </div>
</div>
  );
} 