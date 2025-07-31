"use client";

import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Position, User, Shift, ShiftRequest } from "../types/models";
import { useDrop, DropTargetMonitor } from 'react-dnd';
import React from "react";

type FullShift = Shift & { user: User, position: Position, shiftRequestId: string | null };
type ShiftRequestWithDetails = ShiftRequest & { user: User, position: Position, shift?: Shift | null };

const ItemTypes = { SHIFT_REQUEST: "shift_request" };

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
    shift => isSameDay(new Date(shift.date), day) && shift.userId === employee.id
  );

  const [{ isOver }, drop] = useDrop<ShiftRequestWithDetails, void, { isOver: boolean }>({
    accept: ItemTypes.SHIFT_REQUEST,
    drop: (item: ShiftRequestWithDetails) => onDrop(item, day, item.position.id),
    collect: (monitor: DropTargetMonitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop}
      className={`day-cell relative w-48 flex-shrink-0 border-r min-h-[160px] ${isOver ? 'bg-blue-50' : ''}`}
      onClick={() => onNewShiftClick(day)} // Allow creating new shifts by clicking on a day cell
    >
      {/* Render time slots or background grid here */}
      {timeSlots.map(hour => (
        <div key={hour} className="absolute inset-x-0" style={{ top: `${(hour / 24) * 100}%`, height: `${(1 / 24) * 100}%`, borderTop: '1px dotted #e0e0e0' }}></div>
      ))}

      {/* Render shifts */}
      {shiftsForEmployeeAndDay.map(shift => {
        const style = getShiftPosition(shift, parseInt(shift.startTime.slice(0,2)));
        return (
          <div
            key={shift.id}
            className="absolute bg-blue-400 text-white rounded px-1 text-xs overflow-hidden cursor-pointer"
            style={{ ...style, width: '90%', left: '5%' }}
            onClick={(e) => { e.stopPropagation(); onShiftClick(shift); }} // Prevent parent click
          >
            <p className="font-bold">{shift.position.name}</p>
            <p>{shift.startTime.slice(0,5)} - {shift.endTime.slice(0,5)}</p>
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
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 }); // 週の始まり（日曜日）
  const daysInWeek = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: addDays(startOfCurrentWeek, 6)
  });

  const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 0時から23時までの時間スロット

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
    <div className="daily-calendar-container flex flex-col h-full overflow-hidden">
      <div className="calendar-header flex-shrink-0 flex items-center bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="employee-column-header w-40 flex-shrink-0 text-center py-2 font-bold border-r">従業員</div>
        <div className="dates-row flex-grow overflow-x-auto flex">
          {daysInWeek.map(day => (
            <div key={day.toISOString()} className="date-cell flex-shrink-0 w-48 text-center py-2 font-bold border-r">
              {format(day, 'M/d (E)', { locale: ja })}
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-body flex-grow overflow-y-auto">
        <div className="flex">
          <div className="time-slots-column w-40 flex-shrink-0 bg-white border-r">
            {employees.map(employee => (
              <div key={employee.id} className="employee-cell h-20 flex items-center justify-center border-b">
                {employee.name}
              </div>
            ))}
          </div>
          <div className="calendar-grid flex-grow overflow-x-auto">
            {employees.map(employee => (
              <div key={employee.id} className="employee-row flex border-b">
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
    </div>
  );
};

export default DailyShiftCalendar;
