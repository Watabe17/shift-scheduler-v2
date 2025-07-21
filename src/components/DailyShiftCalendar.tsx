"use client";

import { useState, useCallback } from "react";
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Position, User, Shift, ShiftRequest as PrismaShiftRequest } from '@prisma/client';
import { useDrop } from 'react-dnd';

type FullShift = Shift & { user: User, position: Position, shiftRequestId: string | null };
type ShiftRequest = PrismaShiftRequest & { user: User, position: Position, shift?: Shift | null };

const ItemTypes = { SHIFT_REQUEST: "shift_request" };

type DailyShiftCalendarProps = {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  shifts: FullShift[];
  employees: User[];
  positions: Position[];
  onDrop: (item: ShiftRequest, date: Date, positionId: string) => void;
  onShiftClick: (shift: FullShift) => void;
  onSaveShift: (shiftData: Partial<Shift>, isNew: boolean) => Promise<void>;
  onDeleteShift: () => Promise<void>;
  onNewShiftClick: (date: Date) => void;
};

const DailyShiftCalendar = ({
  currentDate,
  onDateChange,
  shifts,
  employees,
  positions,
  onDrop,
  onShiftClick,
  onSaveShift,
  onDeleteShift,
  onNewShiftClick
}: DailyShiftCalendarProps) => {
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 }); // 週の始まり（日曜日）
  const daysInWeek = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: addDays(startOfCurrentWeek, 6)
  });

  const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 0時から23時までの時間スロット

  const getShiftPosition = (shift: FullShift, startHour: number) => {
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
                  const shiftsForEmployeeAndDay = shifts.filter(
                    shift => isSameDay(new Date(shift.date), day) && shift.userId === employee.id
                  );

                  // Drop target for new shifts
                  const [{ isOver }, drop] = useDrop(() => ({
                    accept: ItemTypes.SHIFT_REQUEST,
                    drop: (item: ShiftRequest) => onDrop(item, day, item.position.id),
                    collect: monitor => ({ isOver: monitor.isOver() }),
                  }));

                  return (
                    <div
                      key={day.toISOString()}
                      ref={drop as any}
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