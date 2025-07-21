"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import { useState, useEffect, useMemo } from "react";
import { Shift, Position } from "@prisma/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ja } from 'date-fns/locale';

type ConfirmedShift = Shift & { position: Position };

const days = ["日", "月", "火", "水", "木", "金", "土"];

const EmployeeDashboard = () => {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [shifts, setShifts] = useState<ConfirmedShift[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (session) {
      const fetchShifts = async () => {
        const res = await fetch('/api/shifts');
        if (res.ok) {
          const data = await res.json();
          setShifts(data);
        }
      };
      fetchShifts();
    }
  }, [session]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { locale: ja });
    const endDate = endOfWeek(monthEnd, { locale: ja });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);
  
  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.date), date));
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!session) {
    return null; // Should be redirected by onUnauthenticated
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">
                マイダッシュボード
            </h1>
            <div className="flex items-center gap-4">
                <NotificationBell />
                <LogoutButton />
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
            &lt; 前月
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {format(currentMonth, "yyyy年 MMMM", { locale: ja })}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
            次月 &gt;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden shadow">
          {days.map((day) => (
            <div key={day} className="text-center font-bold text-sm py-2 bg-white text-gray-600 border-b">
              {day}
            </div>
          ))}

          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const shiftsOnDay = getShiftsForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={day.toString()} className={`p-2 h-32 flex flex-col relative group transition-colors duration-150 ${isCurrentMonth ? "bg-white" : "bg-gray-100"}`}>
                <span className={`text-sm font-medium ${isToday ? "flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full" : "text-gray-900" } ${!isCurrentMonth && "text-gray-400"}`}>
                  {format(day, "d")}
                </span>
                <div className="mt-1 overflow-y-auto text-xs">
                  {shiftsOnDay.map(shift => (
                    <div key={shift.id} className="mb-1 p-1 bg-green-100 border-l-4 border-green-500 rounded-r-md">
                      <p className="font-bold text-green-800">{shift.position.name}</p>
                      <p className="text-gray-600">{shift.startTime} - {shift.endTime}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 text-center">
            <a href="/employee/shift-request" className="text-blue-600 hover:text-blue-800 hover:underline">
                希望シフトの提出・管理はこちら &rarr;
            </a>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard; 