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
      console.log('Fetching shift requests for user:', session.user.id);
      const response = await fetch(`/api/employees/${session.user.id}/shift-requests`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('シフト希望の取得に失敗しました。');
      }
      
      const data = await response.json();
      console.log('Shift requests data:', data);
      
      const formattedEvents = data.map((req: any) => ({
        id: req.id,
        title: `${format(new Date(`1970-01-01T${req.startTime}`), 'HH:mm')} - ${format(new Date(`1970-01-01T${req.endTime}`), 'HH:mm')}`,
        start: new Date(req.date),
        end: new Date(req.date),
      }));
      
      console.log('Formatted events:', formattedEvents);
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error in fetchShiftRequests:', error);
      alert(error instanceof Error ? error.message : 'エラーが発生しました。');
    }
  };

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
    if (status === 'authenticated' && session) {
      console.log('User ID:', session.user?.id);
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
          userId: session.user.id,
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
        {/* シフト申請へのリンク */}
        <div 
          className="mb-6 rounded-lg p-6 text-white shadow-lg"
          style={{
            background: 'linear-gradient(to right, #3b82f6, #2563eb)',
            border: '2px solid #1d4ed8'
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl md:text-2xl font-bold mb-2">シフト申請</h2>
              <p style={{ color: '#dbeafe' }}>月間カレンダーでシフト希望を提出できます</p>
            </div>
            <a
              href="/employee/shift-request"
              className="inline-flex items-center px-6 py-3 font-semibold rounded-lg shadow-md transition-colors duration-200"
              style={{
                backgroundColor: '#ffffff',
                color: '#2563eb'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              シフト申請ページへ
            </a>
          </div>
        </div>

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
