"use client";

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import ShiftRequestModal from '@/components/ShiftRequestModal';
import { useSession } from 'next-auth/react';

const locales = {
  'ja': ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface ShiftRequestEvent extends Event {
  id: string;
  title: string;
}

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<ShiftRequestEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchShiftRequests = async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(`/api/employees/${session.user.id}/shift-requests`);
      if (!response.ok) {
        throw new Error('シフト希望の取得に失敗しました。');
      }
      const data = await response.json();
      const formattedEvents = data.map((req: any) => ({
        id: req.id,
        title: `${format(new Date(`1970-01-01T${req.startTime}`), 'HH:mm')} - ${format(new Date(`1970-01-01T${req.endTime}`), 'HH:mm')}`,
        start: new Date(req.date),
        end: new Date(req.date),
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'エラーが発生しました。');
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchShiftRequests();
    }
  }, [session, status]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleModalSave = async ({ startTime, endTime }: { startTime: string, endTime: string }) => {
    if (!selectedDate || !session?.user?.id) return;

    try {
      const response = await fetch('/api/shift-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: session.user.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        throw new Error('シフト希望の提出に失敗しました。');
      }
      
      alert('シフト希望を提出しました！');
      handleModalClose();
      await fetchShiftRequests(); // データを再取得してカレンダーを更新
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'エラーが発生しました。');
    }
  };


  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen"><p>読み込み中...</p></div>;
  }
  
  if (status === 'unauthenticated') {
      // 必要であればログインページへリダイレクト
      // redirect('/login');
      return <div className="flex justify-center items-center h-screen"><p>アクセスするにはログインが必要です。</p></div>;
  }


  return (
    <>
      <ShiftRequestModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        selectedDate={selectedDate}
      />
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">シフト希望</h1>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="mb-4 text-gray-600">希望する日をクリックして、シフト希望を提出してください。</p>
          <div style={{ height: '70vh' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={['month']}
              selectable
              onSelectSlot={handleSelectSlot}
              messages={{
                next: "次",
                previous: "前",
                today: "今日",
                month: "月",
                week: "週",
                day: "日",
                agenda: "一覧",
                date: "日付",
                time: "時間",
                event: "イベント",
                noEventsInRange: "この範囲にイベントはありません。",
                showMore: total => `+ さらに${total}件`
              }}
              culture='ja'
            />
          </div>
        </div>
      </div>
    </>
  );
}
