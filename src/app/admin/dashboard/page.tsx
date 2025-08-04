"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useSession } from "next-auth/react";

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
  startHour: number;
  endHour: number;
  role: string;
}

export default function ShiftManagementPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [activeTab, setActiveTab] = useState<'staff' | 'role'>('staff');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ドラッグ関連の状態
  const [isDragging, setIsDragging] = useState(false);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [dragType, setDragType] = useState<'resize-left' | 'resize-right' | 'move' | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [startLeft, setStartLeft] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/admin/employees');
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
          
          // 仮のシフトデータを生成
          const mockShifts: Shift[] = data.map((employee: Employee, index: number) => ({
            id: `shift-${employee.id}`,
            employeeId: employee.id,
            startHour: 10 + (index % 4),
            endHour: 14 + (index % 4),
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

  // シフトの位置と幅を計算
  const getShiftStyle = (shift: Shift) => {
    const hourWidth = 64; // w-16 = 64px
    const startPos = Math.max(0, (shift.startHour - 9) * hourWidth);
    const width = Math.max(hourWidth, (shift.endHour - shift.startHour) * hourWidth);
    
    return {
      left: `${startPos}px`,
      width: `${width}px`,
      position: 'absolute' as const,
      height: '28px',
      backgroundColor: '#3b82f6',
      borderRadius: '4px',
      cursor: 'move',
      userSelect: 'none' as const,
      zIndex: isDragging && currentShift?.id === shift.id ? 20 : 10,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '11px',
      fontWeight: '500',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      minWidth: '64px',
    };
  };

  // 新しいシフトを作成
  const createNewShift = (employeeId: string, startHour: number) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      employeeId,
      startHour,
      endHour: startHour + 1,
      role: employees.find(emp => emp.id === employeeId)?.role || 'キッチン'
    };
    setShifts(prev => [...prev, newShift]);
  };

  // セルクリックでシフト作成
  const handleCellClick = (employeeId: string, hour: number) => {
    const existingShift = shifts.find(shift => 
      shift.employeeId === employeeId && 
      shift.startHour <= hour && 
      shift.endHour > hour
    );
    
    if (!existingShift) {
      createNewShift(employeeId, hour);
    }
  };

  // シフト削除
  const deleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(shift => shift.id !== shiftId));
  };

  // マウスダウンイベント（ドラッグ開始）
  const handleMouseDown = (e: React.MouseEvent, shift: Shift, type?: 'resize-left' | 'resize-right') => {
    e.preventDefault();
    setIsDragging(true);
    setCurrentShift(shift);
    setDragType(type || 'move');
    
    const container = containerRef.current;
    const containerRect = container?.getBoundingClientRect();
    const containerLeft = containerRect?.left || 0;
    const containerScrollLeft = container?.scrollLeft || 0;
    
    setStartX(e.clientX - containerLeft + containerScrollLeft);
    
    const hourWidth = 64;
    const startPos = (shift.startHour - 9) * hourWidth;
    const width = (shift.endHour - shift.startHour) * hourWidth;
    
    setStartWidth(width);
    setStartLeft(startPos);
  };

  // マウス移動イベント（ドラッグ中）
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !currentShift || !dragType) return;

      const container = containerRef.current;
      const containerRect = container?.getBoundingClientRect();
      const containerLeft = containerRect?.left || 0;
      const containerScrollLeft = container?.scrollLeft || 0;
      const currentX = e.clientX - containerLeft + containerScrollLeft;
      
      const deltaX = currentX - startX;
      const hourWidth = 64;
      
      const snapDelta = Math.round(deltaX / hourWidth) * hourWidth;

      setShifts(prevShifts => 
        prevShifts.map(shift => {
          if (shift.id !== currentShift.id) return shift;

          let newStart = shift.startHour;
          let newEnd = shift.endHour;

          if (dragType === 'resize-left') {
            const newLeft = Math.max(0, startLeft + snapDelta);
            const newWidth = Math.max(hourWidth, startWidth - snapDelta);
            newStart = Math.floor(newLeft / hourWidth) + 9;
            newEnd = Math.min(20, newStart + Math.floor(newWidth / hourWidth));
            
            if (newEnd - newStart < 1) {
              newEnd = newStart + 1;
            }
            
            if (newStart >= 20) {
              newStart = 19;
              newEnd = 20;
            }
          } else if (dragType === 'resize-right') {
            const newWidth = Math.max(hourWidth, startWidth + snapDelta);
            const maxWidth = (20 - shift.startHour) * hourWidth;
            const actualWidth = Math.min(newWidth, maxWidth);
            newEnd = Math.min(20, shift.startHour + Math.floor(actualWidth / hourWidth));
            
            if (newEnd - newStart < 1) {
              newEnd = newStart + 1;
            }
            
            if (newEnd <= shift.startHour) {
              newEnd = shift.startHour + 1;
            }
          } else if (dragType === 'move') {
            const currentWidth = startWidth;
            const maxLeft = (20 - Math.floor(currentWidth / hourWidth)) * hourWidth;
            const newLeft = Math.max(0, Math.min(startLeft + snapDelta, maxLeft));
            const duration = shift.endHour - shift.startHour;
            newStart = Math.floor(newLeft / hourWidth) + 9;
            newEnd = Math.min(20, newStart + duration);
            
            if (newStart < 9) {
              newStart = 9;
              newEnd = Math.min(20, newStart + duration);
            }
            if (newEnd > 20) {
              newEnd = 20;
              newStart = Math.max(9, newEnd - duration);
            }
          }

          return {
            ...shift,
            startHour: newStart,
            endHour: newEnd
          };
        })
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setCurrentShift(null);
      setDragType(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, currentShift, dragType, startX, startWidth, startLeft]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左側サイドバー */}
      <div className="sidebar">
        <div 
          className={`sidebar-item ${viewMode === 'month' ? 'active' : ''}`}
          onClick={() => setViewMode('month')}
          title="月シフト管理作成"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
        </div>
        <div 
          className={`sidebar-item ${viewMode === 'day' ? 'active' : ''}`}
          onClick={() => setViewMode('day')}
          title="日付ごとの管理作成"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        {/* 上部ヘッダー */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-8 py-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-5">
            <div className="text-lg font-medium">
              {viewMode === 'month' ? 'シフト管理ページ 月' : 'シフト管理ページ 日・役割'}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-blue-600 bg-opacity-20 px-4 py-2 rounded-full">
              <UserIcon className="w-4 h-4" />
              {session?.user?.name || 'ユーザー'}
            </div>
          </div>
        </div>

        {/* 店舗情報 */}
        <div className="bg-white px-8 py-4 border-b border-gray-200 text-gray-600 text-sm">
          DINING●▲・・・
        </div>

        {/* シフト管理エリア */}
        <div className="flex-1 bg-white m-5 rounded-lg shadow-lg overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="flex bg-gray-200 rounded-md p-0.5">
              <button 
                className={`px-5 py-2 rounded text-sm transition-all duration-300 ${
                  activeTab === 'staff' ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-600'
                }`}
                onClick={() => setActiveTab('staff')}
              >
                スタッフ別
              </button>
              <button 
                className={`px-5 py-2 rounded text-sm transition-all duration-300 ${
                  activeTab === 'role' ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-600'
                }`}
                onClick={() => setActiveTab('role')}
              >
                役割別
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button 
                className="w-8 h-8 border border-gray-300 bg-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                onClick={() => handleDateChange('prev')}
              >
                ‹
              </button>
              <div className="font-medium text-base">
                {format(currentDate, 'yyyy/MM月dd日 (EEEE)', { locale: ja })}
              </div>
              <button 
                className="w-8 h-8 border border-gray-300 bg-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                onClick={() => handleDateChange('next')}
              >
                ›
              </button>
              <button 
                className="w-8 h-8 border border-gray-300 bg-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                title="カレンダー表示"
              >
                <CalendarDaysIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto" ref={containerRef}>
            <table className="w-full border-collapse text-sm table-fixed" style={{ tableLayout: 'fixed' }}>
              {activeTab === 'staff' ? (
                // スタッフ別表示
                <>
                  <thead>
                    <tr>
                      <th className="bg-gray-50 text-left p-3 border border-gray-200 font-medium text-gray-700 sticky left-0 z-10" style={{ width: '128px' }}>
                        従業員名
                      </th>
                      {Array.from({ length: 12 }, (_, i) => i + 9).map(hour => (
                        <th key={hour} className="bg-blue-500 text-white p-2 border border-gray-200 text-xs font-medium w-16" style={{ width: '64px' }}>
                          {hour}時
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={13} className="text-center py-8 text-gray-500">
                          従業員データを読み込み中...
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="text-center py-8 text-gray-500">
                          登録されている従業員がありません
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => {
                        const employeeShifts = shifts.filter(shift => shift.employeeId === employee.id);
                        
                        return (
                          <tr key={employee.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="bg-blue-50 text-left p-3 border border-gray-200 font-medium text-gray-700 sticky left-0 z-10" style={{ width: '128px' }}>
                              {employee.name}
                            </td>
                            {Array.from({ length: 12 }, (_, i) => {
                              const hour = i + 9;
                              const employeeShiftsInHour = employeeShifts.filter(shift => 
                                shift.startHour <= hour && shift.endHour > hour
                              );
                              
                              return (
                                <td 
                                  key={i} 
                                  className="border border-gray-200 p-2 w-16 relative hover:bg-gray-50 cursor-pointer" 
                                  style={{ width: '64px' }}
                                  onClick={() => handleCellClick(employee.id, hour)}
                                  title={`${hour}時 - クリックでシフト作成`}
                                >
                                  {employeeShiftsInHour.map(shift => (
                                    <div
                                      key={shift.id}
                                      className={`shift-bar ${isDragging && currentShift?.id === shift.id ? 'dragging' : ''}`}
                                      style={getShiftStyle(shift)}
                                      onMouseDown={(e) => handleMouseDown(e, shift)}
                                      data-shift-id={shift.id}
                                    >
                                      <div
                                        className="shift-handle left absolute top-0 left-0 w-1 h-full cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          handleMouseDown(e, shift, 'resize-left');
                                        }}
                                      />
                                      <div
                                        className="shift-handle right absolute top-0 right-0 w-1 h-full cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          handleMouseDown(e, shift, 'resize-right');
                                        }}
                                      />
                                      <div className="text-white text-xs font-medium">
                                        {employees.find(emp => emp.id === shift.employeeId)?.name || '従業員'}
                                      </div>
                                      <button
                                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full opacity-0 hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteShift(shift.id);
                                        }}
                                        title="シフト削除"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </>
              ) : (
                // 役割別表示
                <>
                  <thead>
                    <tr>
                      <th className="bg-gray-50 text-left p-3 border border-gray-200 font-medium text-gray-700 sticky left-0 z-10" style={{ width: '128px' }}>
                        役割
                      </th>
                      {Array.from({ length: 12 }, (_, i) => i + 9).map(hour => (
                        <th key={hour} className="bg-blue-500 text-white p-2 border border-gray-200 text-xs font-medium w-16" style={{ width: '64px' }}>
                          {hour}時
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="bg-blue-50 text-left p-3 border border-gray-200 font-medium text-gray-700 sticky left-0 z-10" style={{ width: '128px' }}>
                        <div className="font-medium">キッチン</div>
                        <div className="text-xs text-gray-600">必要人数: 2人</div>
                        <div className="text-xs text-red-600">過不足: -1人</div>
                      </td>
                      {Array.from({ length: 12 }, (_, i) => (
                        <td key={i} className="border border-gray-200 p-2 w-16 relative" style={{ width: '64px' }}>
                          {shifts.filter(shift => shift.role === 'キッチン').map(shift => (
                           <div
                             key={shift.id}
                             className={`shift-bar ${isDragging && currentShift?.id === shift.id ? 'dragging' : ''}`}
                             style={getShiftStyle(shift)}
                             onMouseDown={(e) => handleMouseDown(e, shift)}
                             data-shift-id={shift.id}
                           >
                             <div
                               className="shift-handle left absolute top-0 left-0 w-1 h-full bg-blue-400 cursor-ew-resize"
                               onMouseDown={(e) => {
                                 e.stopPropagation();
                                 handleMouseDown(e, shift, 'resize-left');
                               }}
                             />
                             <div
                               className="shift-handle right absolute top-0 right-0 w-1 h-full bg-blue-400 cursor-ew-resize"
                               onMouseDown={(e) => {
                                 e.stopPropagation();
                                 handleMouseDown(e, shift, 'resize-right');
                               }}
                             />
                             <div className="text-white text-xs font-medium flex items-center justify-center h-full">
                               {employees.find(emp => emp.id === shift.employeeId)?.name || '従業員'}
                             </div>
                           </div>
                         ))}
                       </td>
                     ))}
                   </tr>
                   <tr className="hover:bg-gray-50 transition-colors duration-200">
                     <td className="bg-blue-50 text-left p-3 border border-gray-200 font-medium text-gray-700 sticky left-0 z-10" style={{ width: '128px' }}>
                       <div className="font-medium">ホール</div>
                       <div className="text-xs text-gray-600">必要人数: 3人</div>
                       <div className="text-xs text-green-600">過不足: +1人</div>
                     </td>
                     {Array.from({ length: 12 }, (_, i) => (
                       <td key={i} className="border border-gray-200 p-2 w-16 relative" style={{ width: '64px' }}>
                         {shifts.filter(shift => shift.role === 'ホール').map(shift => (
                          <div
                            key={shift.id}
                            className={`shift-bar ${isDragging && currentShift?.id === shift.id ? 'dragging' : ''}`}
                            style={getShiftStyle(shift)}
                            onMouseDown={(e) => handleMouseDown(e, shift)}
                            data-shift-id={shift.id}
                          >
                            <div
                              className="shift-handle left absolute top-0 left-0 w-1 h-full bg-blue-400 cursor-ew-resize"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleMouseDown(e, shift, 'resize-left');
                              }}
                            />
                            <div
                              className="shift-handle right absolute top-0 right-0 w-1 h-full bg-blue-400 cursor-ew-resize"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleMouseDown(e, shift, 'resize-right');
                              }}
                            />
                            <div className="text-white text-xs font-medium flex items-center justify-center h-full">
                              {employees.find(emp => emp.id === shift.employeeId)?.name || '従業員'}
                            </div>
                          </div>
                        ))}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="bg-blue-50 text-left p-3 border border-gray-200 font-medium text-gray-700 sticky left-0 z-10" style={{ width: '128px' }}>
                      <div className="font-medium">レジ</div>
                      <div className="text-xs text-gray-600">必要人数: 1人</div>
                      <div className="text-xs text-gray-600">過不足: 0人</div>
                    </td>
                    {Array.from({ length: 12 }, (_, i) => (
                      <td key={i} className="border border-gray-200 p-2 w-16 relative" style={{ width: '64px' }}>
                        {shifts.filter(shift => shift.role === 'レジ').map(shift => (
                         <div
                           key={shift.id}
                           className={`shift-bar ${isDragging && currentShift?.id === shift.id ? 'dragging' : ''}`}
                           style={getShiftStyle(shift)}
                           onMouseDown={(e) => handleMouseDown(e, shift)}
                           data-shift-id={shift.id}
                         >
                           <div
                             className="shift-handle left absolute top-0 left-0 w-1 h-full bg-blue-400 cursor-ew-resize"
                             onMouseDown={(e) => {
                               e.stopPropagation();
                               handleMouseDown(e, shift, 'resize-left');
                             }}
                           />
                           <div
                             className="shift-handle right absolute top-0 right-0 w-1 h-full bg-blue-400 cursor-ew-resize"
                             onMouseDown={(e) => {
                               e.stopPropagation();
                               handleMouseDown(e, shift, 'resize-right');
                             }}
                           />
                           <div className="text-white text-xs font-medium flex items-center justify-center h-full">
                             {employees.find(emp => emp.id === shift.employeeId)?.name || '従業員'}
                           </div>
                         </div>
                       ))}
                     </td>
                   ))}
                 </tr>
                 <tr className="hover:bg-gray-50 transition-colors duration-200">
                   <td className="bg-blue-50 text-left p-3 border border-gray-200 font-medium text-gray-700 sticky left-0 z-10" style={{ width: '128px' }}>
                     <div className="font-medium">経理</div>
                     <div className="text-xs text-gray-600">必要人数: 1人</div>
                     <div className="text-xs text-red-600">過不足: -1人</div>
                   </td>
                   {Array.from({ length: 12 }, (_, i) => (
                     <td key={i} className="border border-gray-200 p-2 w-16 relative" style={{ width: '64px' }}>
                       {shifts.filter(shift => shift.role === '経理').map(shift => (
                        <div
                          key={shift.id}
                          className={`shift-bar ${isDragging && currentShift?.id === shift.id ? 'dragging' : ''}`}
                          style={getShiftStyle(shift)}
                          onMouseDown={(e) => handleMouseDown(e, shift)}
                          data-shift-id={shift.id}
                        >
                          <div
                            className="shift-handle left absolute top-0 left-0 w-1 h-full bg-blue-400 cursor-ew-resize"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, shift, 'resize-left');
                            }}
                          />
                          <div
                            className="shift-handle right absolute top-0 right-0 w-1 h-full bg-blue-400 cursor-ew-resize"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, shift, 'resize-right');
                            }}
                          />
                          <div className="text-white text-xs font-medium flex items-center justify-center h-full">
                            {employees.find(emp => emp.id === shift.employeeId)?.name || '従業員'}
                          </div>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  </div>

  <style jsx>{`
    /* 左側サイドバー */
    .sidebar {
      width: 60px;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;
      box-shadow: 2px 0 5px rgba(0,0,0,0.1);
      border-right: 1px solid #e0e0e0;
    }

    .sidebar-item {
      width: 40px;
      height: 40px;
      margin: 10px 0;
      background: #f5f5f5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #666;
      border: 1px solid #e0e0e0;
    }

    .sidebar-item:hover {
      background: #e3f2fd;
      color: #2196F3;
    }

    .sidebar-item.active {
      background: #2196F3;
      color: white;
    }

    .sidebar-item svg {
      width: 20px;
      height: 20px;
    }

    /* シフトバーのスタイル */
    .shift-bar {
      background: #3b82f6;
      border-radius: 4px;
      position: absolute;
      height: 28px;
      cursor: move;
      user-select: none;
      z-index: 10;
      transition: all 0.2s ease;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      min-width: 64px;
    }

    .shift-bar:hover {
      background: #2563eb;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .shift-bar.dragging {
      background: #1d4ed8;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
      transform: translateY(-50%) scale(1.02);
    }

    .shift-bar:hover button {
      opacity: 1;
    }

    .shift-handle {
      opacity: 0;
      transition: opacity 0.2s;
    }

    .shift-bar:hover .shift-handle {
      opacity: 1;
    }

    .shift-handle:hover {
      opacity: 1 !important;
    }

    .shift-handle.left {
      cursor: ew-resize;
      background: rgba(255, 255, 255, 0.3) !important;
      border-radius: 4px 0 0 4px;
    }

    .shift-handle.right {
      cursor: ew-resize;
      background: rgba(255, 255, 255, 0.3) !important;
      border-radius: 0 4px 4px 0;
    }

    .shift-bar:hover .shift-handle {
      opacity: 1;
      background: rgba(255, 255, 255, 0.5) !important;
    }

    .shift-handle:hover {
      background: rgba(255, 255, 255, 0.7) !important;
    }

    .shift-bar.dragging .shift-handle {
      opacity: 1 !important;
      background: rgba(255, 255, 255, 0.8) !important;
    }

    .shift-bar:hover {
      transform: translateY(-50%) scale(1.02);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
  `}</style>
</div>
  );
} 