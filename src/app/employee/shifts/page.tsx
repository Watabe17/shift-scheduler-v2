"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views, Event as CalendarEvent } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- 型定義 ---
interface Position { id: string; name: string; }
interface Shift { id: string; date: string; startTime: string; endTime: string; position: Position; }
interface RequiredStaffRule { id: string; positionId: string; position: Position; dayOfWeek: number; timeSlot: string; count: number; }
interface TotalHours { totalHours: number; totalMinutes: number; }

interface MyCalendarEvent extends CalendarEvent {
  start: Date; // オーバーライド
  end: Date;   // オーバーライド
  resource: Shift;
}

const locales = { ja: ja };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 0 }),
  getDay,
  locales,
});

// --- レーン内のシフト表示コンポーネント ---
const ShiftInLane = ({ shift }: { shift: Shift }) => (
    <div className="bg-blue-500 text-white text-xs rounded p-1.5 my-1">
        <p className="font-bold">{shift.position.name}</p>
        <p>{shift.startTime.slice(0,5)} - {shift.endTime.slice(0,5)}</p>
    </div>
  );


// --- メインページコンポーネント ---
export default function EmployeeShiftsPage() {
  const [events, setEvents] = useState<MyCalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [totalHours, setTotalHours] = useState<TotalHours | null>(null);
  const [requiredStaff, setRequiredStaff] = useState<RequiredStaffRule[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const [shiftsRes, requiredStaffRes, positionsRes, totalHoursRes] = await Promise.all([
        fetch(`/api/shifts?year=${year}&month=${month}`),
        fetch("/api/admin/required-staff"),
        fetch("/api/admin/positions"),
        fetch(`/api/shifts/total-hours?year=${year}&month=${month}`),
      ]);

      if (!shiftsRes.ok || !requiredStaffRes.ok || !positionsRes.ok || !totalHoursRes.ok) {
        throw new Error("データの取得に失敗しました。");
      }

      const shifts: Shift[] = await shiftsRes.json();
      const requiredStaffData: RequiredStaffRule[] = await requiredStaffRes.json();
      const positionsData: Position[] = await positionsRes.json();
      const totalHoursData: TotalHours = await totalHoursRes.json();
      
      const calendarEvents = shifts.map((shift) => {
        const startDate = new Date(`${shift.date.substring(0, 10)}T${shift.startTime}`);
        const endDate = new Date(`${shift.date.substring(0, 10)}T${shift.endTime}`);
        return {
          id: shift.id,
          title: `${shift.position.name} ${shift.startTime.slice(0,5)}-${shift.endTime.slice(0,5)}`,
          start: startDate,
          end: endDate,
          resource: shift,
        };
      });

      setEvents(calendarEvents as MyCalendarEvent[]);
      setRequiredStaff(requiredStaffData);
      setPositions(positionsData);
      setTotalHours(totalHoursData);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData(currentDate);
  }, [currentDate, fetchAllData]);

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleDownloadPdf = async () => {
    // PDFダウンロードロジック (変更なし)
    const doc = new jsPDF();
    const font = await fetch('/fonts/NotoSansJP-Regular.ttf').then(res => res.arrayBuffer());
    const fontBase64 = btoa(new Uint8Array(font).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    doc.addFileToVFS('NotoSansJP-Regular.ttf', fontBase64);
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
    doc.setFont('NotoSansJP');
    
    const title = `${format(currentDate, "yyyy年 M月")} のシフト`;
    doc.text(title, 14, 20);

    const tableColumn = ["日付", "曜日", "ポジション", "勤務時間"];
    const tableRows: any[][] = [];
    const sortedEvents = [...events].sort((a,b) => (a.start as Date).getTime() - (b.start as Date).getTime());

    sortedEvents.forEach(event => {
      tableRows.push([
        format(event.start, "M/d"),
        format(event.start, "E", { locale: ja }),
        event.resource.position.name,
        `${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}`
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { font: 'NotoSansJP', fontStyle: 'normal' },
    });
    
    if (totalHours) {
        const totalHoursText = `合計勤務時間: ${totalHours.totalHours}時間 ${totalHours.totalMinutes}分`;
        const textWidth = doc.getStringUnitWidth(totalHoursText) * doc.getFontSize() / doc.internal.scaleFactor;
        const textX = doc.internal.pageSize.getWidth() - 14 - textWidth;
        const lastTableY = (doc as any).lastAutoTable.finalY;
        doc.text(totalHoursText, textX, lastTableY + 10);
    }

    doc.save(`shift-schedule-${format(currentDate, "yyyy-MM")}.pdf`);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
       <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">確定シフト</h1>
            <p className="text-gray-600 mt-1">あなたの確定済みシフトと、全体の必要人数を確認できます。</p>
        </div>
        <div className="flex items-center gap-4">
        {totalHours && (
            <div className="text-lg text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border">
                今月の合計: 
                <span className="font-bold text-blue-600 ml-2">
              {totalHours.totalHours}時間 {totalHours.totalMinutes}分
            </span>
          </div>
        )}
        <button
          onClick={handleDownloadPdf}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition duration-300"
        >
                PDF
        </button>
      </div>
      </header>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          date={currentDate}
          onNavigate={handleNavigate}
            defaultView={Views.MONTH}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
          culture="ja"
            style={{ height: '75vh' }}
            messages={{ next: "次", previous: "前", today: "今日", month: "月", week: "週", day: "日" }}
            components={{
                toolbar: (toolbar) => ( /* 共通ツールバー */
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 pb-4 border-b">
                        <div className="flex items-center gap-2 mb-4 sm:mb-0">
                        <button type="button" onClick={() => toolbar.onNavigate('PREV')} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"> &lt; </button>
                        <button type="button" onClick={() => toolbar.onNavigate('TODAY')} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">今日</button>
                        <button type="button" onClick={() => toolbar.onNavigate('NEXT')} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"> &gt; </button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-700">{toolbar.label}</h2>
                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        {Object.values(Views).map(viewName => (
                            <button key={viewName} onClick={() => toolbar.onView(viewName)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${toolbar.view === viewName ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                            { {month: '月', week: '週', day: '日', work_week: '稼働週', agenda: 'リスト'}[viewName] || viewName }
                            </button>
                        ))}
                        </div>
                    </div>
                ),
                month: {
                    dateHeader: ({ date, label }) => {
                        const dayOfWeek = getDay(date);
                        const rulesForDay = requiredStaff.filter(rule => rule.dayOfWeek === dayOfWeek);
                        const shiftsOnDay = events.filter(e => isSameDay(e.start as Date, date));
                        const myShiftOnDay = shiftsOnDay.length > 0;

                        return (
                            <div className={`p-2 min-h-[140px] flex flex-col ${myShiftOnDay ? 'bg-blue-50' : ''}`}>
                                <div className="text-center text-sm mb-1">{label}</div>
                                {myShiftOnDay && <ShiftInLane shift={shiftsOnDay[0].resource} />}
                                
                                <div className="mt-auto pt-2 text-[10px] space-y-1">
                                    {rulesForDay.map(rule => (
                                        <div key={rule.id} className="px-1.5 py-0.5 rounded-full text-white bg-gray-400">
                                            {rule.position.name}: {rule.count}人
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                },
                event: () => null // 月表示ではカスタムdateHeaderで表示するためデフォルトのイベントは非表示
            }}
        />
      </div>
    </div>
  );
} 