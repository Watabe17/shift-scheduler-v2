"use client";

import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Position, User, Shift, ShiftRequest } from "../types/models";
import { useDrop, DropTargetMonitor } from 'react-dnd';
import React from "react";

type FullShift = Shift & { user: User, position: Position, shiftRequestId: string | null };
type ShiftRequestWithDetails = ShiftRequest & { user: User, position: Position, shift?: Shift | null };

const ItemTypes = { SHIFT_REQUEST: "shift_request" };

// 役職ごとの色を定義
const positionColors: { [key: string]: string } = {
  'キッチン': 'bg-red-500',
  'ホール': 'bg-blue-500',
  'レジ': 'bg-green-500',
  '経理': 'bg-purple-500',
  'default': 'bg-gray-500'
};

const getPositionColor = (positionName: string): string => {
  return positionColors[positionName] || positionColors.default;
};

type DayCellProps = {
  day: Date;
  employee: User;
  shifts: FullShift[];
  onDrop: (item: ShiftRequestWithDetails, date: Date, positionId: string) => void;
  onNewShiftClick: (date: Date) => void;
  onShiftClick: (shift: FullShift) => void;
  getShiftPosition: (shift: FullShift, startHour: number) => React.CSSProperties;
  timeSlots: number[];
};

const DayCell = ({
  day,
  employee,
  shifts,
  onDrop,
  onNewShiftClick,
  onShiftClick,
  getShiftPosition,
  timeSlots
}: DayCellProps) => {
  const shiftsForEmployeeAndDay = shifts.filter(
    shift => isSameDay(new Date(shift.date), day) && shift.user.id === employee.id
  );

  const [{ isOver }, drop] = useDrop<ShiftRequestWithDetails, void, { isOver: boolean }>({
    accept: ItemTypes.SHIFT_REQUEST,
    drop: (item: ShiftRequestWithDetails) => onDrop(item, day, item.position.id),
    collect: (monitor: DropTargetMonitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
      className={`day-cell relative w-48 flex-shrink-0 border-r min-h-[160px] transition-colors duration-200 ${
        isOver ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
      }`}
      onClick={() => onNewShiftClick(day)}
    >
      {/* 時間スロットの背景グリッド */}
      {timeSlots.map(hour => (
        <div 
          key={hour} 
          className="absolute inset-x-0 border-t border-gray-200" 
          style={{ 
            top: `${(hour / 24) * 100}%`, 
            height: `${(1 / 24) * 100}%`
          }}
        >
          {/* 時間ラベル（6時、12時、18時のみ表示） */}
          {hour % 6 === 0 && (
            <div className="absolute -top-2 left-1 text-xs text-gray-400 font-medium">
              {hour.toString().padStart(2, '0')}:00
            </div>
          )}
        </div>
      ))}

      {/* シフトバーの表示 */}
      {shiftsForEmployeeAndDay.map(shift => {
        const style = getShiftPosition(shift, parseInt(shift.startTime.slice(0,2)));
        const positionColor = getPositionColor(shift.position.name);
        
        return (
          <div
            key={shift.id}
            className={`absolute ${positionColor} text-white rounded-lg px-2 py-1 text-xs overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
            style={{ 
              ...style, 
              width: '92%', 
              left: '4%',
              minHeight: '24px',
              zIndex: 10
            }}
            onClick={(e) => { 
              e.stopPropagation(); 
              onShiftClick(shift); 
            }}
          >
            <div className="flex flex-col h-full justify-between">
              <div className="font-bold text-xs leading-tight">
                {shift.position.name}
              </div>
              <div className="text-xs leading-tight opacity-90">
                {shift.startTime.slice(0,5)} - {shift.endTime.slice(0,5)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

type DailyShiftCalendarProps = {
  currentDate: Date;
  shifts: FullShift[];
  employees: User[];
  onDrop: (item: ShiftRequestWithDetails, date: Date, positionId: string) => void;
  onShiftClick: (shift: FullShift) => void;
  onNewShiftClick: (date: Date) => void;
};

const DailyShiftCalendar = ({
  currentDate,
  shifts,
  employees,
  onDrop,
  onShiftClick,
  onNewShiftClick
}: DailyShiftCalendarProps) => {
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 });
  const daysInWeek = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: addDays(startOfCurrentWeek, 6)
  });

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const getShiftPosition = (shift: FullShift, startHour: number): React.CSSProperties => {
    const shiftStartHour = parseInt(shift.startTime.slice(0, 2));
    const shiftEndHour = parseInt(shift.endTime.slice(0, 2));
    const shiftStartMinute = parseInt(shift.startTime.slice(3, 5));
    const shiftEndMinute = parseInt(shift.endTime.slice(3, 5));

    if (shiftStartHour === startHour) {
      const top = (shiftStartMinute / 60) * 100;
      const height = ((shiftEndHour - shiftStartHour) * 60 + (shiftEndMinute - shiftStartMinute)) / 60 * 100;
      return { top: `${top}%`, height: `${height}%` };
    }
    return {};
  };

  return (
    <div className="daily-calendar-container flex flex-col h-full overflow-hidden bg-white rounded-lg shadow-lg">
      {/* カレンダーヘッダー */}
      <div className="calendar-header flex-shrink-0 flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b sticky top-0 z-20 shadow-md">
        <div className="employee-column-header w-40 flex-shrink-0 text-center py-3 font-bold border-r border-blue-500">
          従業員
        </div>
        <div className="dates-row flex-grow overflow-x-auto flex">
          {daysInWeek.map(day => (
            <div key={day.toISOString()} className="date-cell flex-shrink-0 w-48 text-center py-3 font-bold border-r border-blue-500">
              <div className="text-sm">{format(day, 'M/d', { locale: ja })}</div>
              <div className="text-xs opacity-90">{format(day, 'E', { locale: ja })}</div>
            </div>
          ))}
        </div>
      </div>

      {/* カレンダーボディ */}
      <div className="calendar-body flex-grow overflow-y-auto">
        <div className="flex">
          {/* 従業員列 */}
          <div className="time-slots-column w-40 flex-shrink-0 bg-gray-50 border-r border-gray-200">
            {employees.map(employee => (
              <div key={employee.id} className="employee-cell h-20 flex items-center justify-center border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-150">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{employee.name}</div>
                  <div className="text-xs text-gray-500">{employee.role}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* カレンダーグリッド */}
          <div className="calendar-grid flex-grow overflow-x-auto">
            {employees.map(employee => (
              <div key={employee.id} className="employee-row flex border-b border-gray-200">
                {daysInWeek.map(day => {
                  return (
                    <DayCell
                      key={day.toISOString()}
                      day={day}
                      employee={employee}
                      shifts={shifts}
                      onDrop={onDrop}
                      onNewShiftClick={onNewShiftClick}
                      onShiftClick={onShiftClick}
                      getShiftPosition={getShiftPosition}
                      timeSlots={timeSlots}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="calendar-legend flex-shrink-0 bg-gray-50 border-t border-gray-200 p-3">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>キッチン</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>ホール</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>レジ</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>経理</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyShiftCalendar;
