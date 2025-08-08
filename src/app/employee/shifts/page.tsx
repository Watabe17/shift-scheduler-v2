"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

interface Shift {
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'tentative' | 'off';
  note: string;
}

interface ShiftData {
  [key: string]: Shift;
}

export default function EmployeeShiftsPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<ShiftData>({});
  const [selectedShift, setSelectedShift] = useState<{ date: string; shift: Shift } | null>(null);
  const [showModal, setShowModal] = useState(false);

  // デモ用シフトデータ
  const demoShifts: ShiftData = {
    '2024-01-01': { startTime: '09:00', endTime: '18:00', status: 'confirmed', note: '' },
    '2024-01-03': { startTime: '13:00', endTime: '22:00', status: 'confirmed', note: '遅番' },
    '2024-01-05': { startTime: '09:00', endTime: '15:00', status: 'tentative', note: '短時間勤務' },
    '2024-01-08': { startTime: '10:00', endTime: '19:00', status: 'confirmed', note: '' },
    '2024-01-10': { startTime: '09:00', endTime: '18:00', status: 'confirmed', note: '' },
    '2024-01-12': { status: 'off', startTime: '', endTime: '', note: '休日' },
    '2024-01-15': { startTime: '09:00', endTime: '18:00', status: 'confirmed', note: '' },
    '2024-01-17': { startTime: '14:00', endTime: '20:00', status: 'tentative', note: '午後から' },
    '2024-01-19': { status: 'off', startTime: '', endTime: '', note: '休日' },
    '2024-01-22': { startTime: '09:00', endTime: '18:00', status: 'confirmed', note: '' },
    '2024-01-24': { startTime: '09:00', endTime: '18:00', status: 'confirmed', note: '' },
    '2024-01-26': { status: 'off', startTime: '', endTime: '', note: '休日' },
    '2024-01-27': { startTime: '09:00', endTime: '17:00', status: 'confirmed', note: '早上がり' }
  };

  useEffect(() => {
    // 実際のアプリケーションではAPIからデータを取得
    setShifts(demoShifts);
  }, []);

  if ((session?.user as any)?.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return (endMinutes - startMinutes) / 60;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日（${weekdays[date.getDay()]}）`;
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // 月曜始まりに調整
    
    const calendar = [];
    let date = 1;
    const today = new Date();
    
    for (let week = 0; week < 6; week++) {
      const weekData = [];
      
      for (let day = 1; day <= 7; day++) {
        if ((week === 0 && day < firstDayOfWeek) || date > lastDay.getDate()) {
          // 前月・次月の日付
          let displayDate;
          if (week === 0 && day < firstDayOfWeek) {
            const prevMonth = new Date(year, month - 1, 0);
            displayDate = prevMonth.getDate() - (firstDayOfWeek - day - 1);
          } else {
            displayDate = date - lastDay.getDate();
          }
          weekData.push({
            date: displayDate,
            isOtherMonth: true,
            isToday: false,
            isWeekend: day === 7,
            isSaturday: day === 6,
            shift: null
          });
        } else {
          // 当月の日付
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
          const shift = shifts[dateKey];
          
          weekData.push({
            date,
            isOtherMonth: false,
            isToday: year === today.getFullYear() && month === today.getMonth() && date === today.getDate(),
            isWeekend: day === 7,
            isSaturday: day === 6,
            shift,
            dateKey
          });
          
          date++;
        }
      }
      
      calendar.push(weekData);
      if (date > lastDay.getDate()) break;
    }
    
    return calendar;
  };

  const updateSummary = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    let workDays = 0;
    let totalHours = 0;
    let offDays = 0;
    
    Object.keys(shifts).forEach(dateKey => {
      if (dateKey.startsWith(monthKey)) {
        const shift = shifts[dateKey];
        if (shift.status === 'off') {
          offDays++;
        } else {
          workDays++;
          totalHours += calculateDuration(shift.startTime, shift.endTime);
        }
      }
    });
    
    return {
      workDays,
      totalHours: Math.round(totalHours),
      avgHours: workDays > 0 ? (totalHours / workDays).toFixed(1) : '0.0',
      offDays
    };
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const showShiftDetail = (dateKey: string, shift: Shift) => {
    setSelectedShift({ date: dateKey, shift });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedShift(null);
  };

  const calendar = generateCalendar();
  const summary = updateSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-teal-400 to-teal-500 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">シフト管理</h1>
            <p className="text-sm opacity-90">シフト確認</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{session?.user?.name}</div>
            <div className="text-xs opacity-90">様</div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex bg-white shadow-sm">
        <div className="flex-1 py-4 px-3 text-center text-sm font-medium text-teal-500 border-b-2 border-teal-500 bg-teal-50">
          シフト確認
        </div>
        <div className="flex-1 py-4 px-3 text-center text-sm text-gray-500 border-b-2 border-transparent">
          シフト希望提出
        </div>
        <div className="flex-1 py-4 px-3 text-center text-sm text-gray-500 border-b-2 border-transparent">
          月間勤務時間
        </div>
      </div>

      {/* 凡例 */}
      <div className="mx-5 mt-5 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">ℹ️</span>
          <span className="font-semibold text-sm text-gray-800">表示説明</span>
        </div>
        <div className="flex justify-around gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border-l-2 border-green-500 rounded-sm"></div>
            <span className="text-xs">確定シフト</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-100 border-l-2 border-orange-500 rounded-sm"></div>
            <span className="text-xs">暫定シフト</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border-l-2 border-gray-500 rounded-sm"></div>
            <span className="text-xs">休み</span>
          </div>
        </div>
      </div>

      {/* カレンダー */}
      <div className="mx-5 mt-5 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-400 to-teal-500 text-white p-4 flex justify-between items-center">
          <button 
            onClick={() => changeMonth(-1)}
            className="text-white text-xl hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
          >
            ‹
          </button>
          <div className="text-lg font-bold">
            {currentDate.getFullYear()}年{String(currentDate.getMonth() + 1).padStart(2, '0')}月
          </div>
        <button
            onClick={() => changeMonth(1)}
            className="text-white text-xl hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
        >
            ›
        </button>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200">月</th>
              <th className="p-3 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200">火</th>
              <th className="p-3 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200">水</th>
              <th className="p-3 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200">木</th>
              <th className="p-3 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200">金</th>
              <th className="p-3 text-xs font-bold text-teal-600 bg-gray-50 border border-gray-200">土</th>
              <th className="p-3 text-xs font-bold text-red-500 bg-gray-50 border border-gray-200">日</th>
            </tr>
          </thead>
          <tbody>
            {calendar.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((day, dayIndex) => (
                  <td 
                    key={dayIndex}
                    className={`p-2 border border-gray-200 h-20 align-top ${
                      day.isOtherMonth ? 'text-gray-400 bg-gray-50' : ''
                    } ${day.isToday ? 'bg-yellow-100 font-bold' : ''}
                    ${day.isSaturday ? 'text-teal-600' : ''}
                    ${day.isWeekend ? 'text-red-500' : ''}
                    ${day.shift ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => day.shift && day.dateKey && showShiftDetail(day.dateKey, day.shift)}
                  >
                    <div className="text-sm font-bold mb-1">
                      {String(day.date).padStart(2, '0')}
                    </div>
                    {day.shift && (
                      <div className={`text-xs p-1 rounded ${
                        day.shift.status === 'confirmed' ? 'bg-green-100 border-l-2 border-green-500' :
                        day.shift.status === 'tentative' ? 'bg-orange-100 border-l-2 border-orange-500' :
                        'bg-gray-100 border-l-2 border-gray-500'
                      }`}>
                        {day.shift.status === 'off' ? (
                          <div className="text-gray-600 font-medium">休み</div>
                        ) : (
                          <>
                            <div className="text-gray-800 font-medium">
                              {day.shift.startTime}-{day.shift.endTime}
                            </div>
                            <div className="text-gray-600">
                              {day.shift.status === 'confirmed' ? '確定' : '暫定'}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* サマリー */}
      <div className="mx-5 mt-5 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 p-4 font-bold text-gray-800 border-b border-gray-200">
          今月の勤務サマリー
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-500">{summary.workDays}</div>
              <div className="text-xs text-gray-600 mt-1">勤務日数</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-500">{summary.totalHours}</div>
              <div className="text-xs text-gray-600 mt-1">総勤務時間</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-500">{summary.avgHours}</div>
              <div className="text-xs text-gray-600 mt-1">平均勤務時間</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-500">{summary.offDays}</div>
              <div className="text-xs text-gray-600 mt-1">休日数</div>
            </div>
          </div>
        </div>
      </div>

      {/* モーダル */}
      {showModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-80 overflow-y-auto">
            <div className="text-lg font-bold mb-5 text-gray-800">
              {formatDate(selectedShift.date)}
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-bold text-gray-600 mb-1">勤務時間</div>
                <div className="text-base text-gray-800">
                  {selectedShift.shift.status === 'off' ? '休み' : `${selectedShift.shift.startTime} - ${selectedShift.shift.endTime}`}
                </div>
                        </div>
              
              <div>
                <div className="text-sm font-bold text-gray-600 mb-1">勤務時間数</div>
                <div className="text-base text-gray-800">
                  {selectedShift.shift.status === 'off' ? '-' : `${calculateDuration(selectedShift.shift.startTime, selectedShift.shift.endTime)}時間`}
                        </div>
                    </div>
              
              <div>
                <div className="text-sm font-bold text-gray-600 mb-1">ステータス</div>
                <div className="text-base text-gray-800">
                  {selectedShift.shift.status === 'confirmed' ? '確定' : 
                   selectedShift.shift.status === 'tentative' ? '暫定' : '休日'}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-bold text-gray-600 mb-1">備考</div>
                <div className="text-base text-gray-800">
                  {selectedShift.shift.note || '-'}
                </div>
              </div>
                                        </div>
            
            <button 
              onClick={closeModal}
              className="w-full mt-6 py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition-colors"
            >
              閉じる
            </button>
                                </div>
                            </div>
      )}

      {/* ログアウトボタン */}
      <div className="fixed bottom-4 right-4">
        <LogoutButton />
      </div>
    </div>
  );
} 