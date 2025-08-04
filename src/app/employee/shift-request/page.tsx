"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Position, ShiftRequest, RequiredStaff, User } from "@/types/models";
import EmployeeShiftRequestModal from "@/components/EmployeeShiftRequestModal";
import { format, startOfWeek, getDay, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, endOfWeek } from "date-fns";
import { ja } from 'date-fns/locale';


type ShiftRequestWithUserAndPosition = ShiftRequest & { user: User, position: Position };
type RequiredStaffWithPosition = RequiredStaff & { position: Position };

const days = ["日", "月", "火", "水", "木", "金", "土"];

const ShiftRequestModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  positions, 
  selectedDate, 
  requestToEdit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: { startTime: string; endTime: string; positionId: string }) => void; 
  positions: Position[];
  selectedDate: Date | null;
  requestToEdit: ShiftRequestWithUserAndPosition | null;
}) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [positionId, setPositionId] = useState("");

  useEffect(() => {
    if (requestToEdit) {
      setStartTime(requestToEdit.startTime);
      setEndTime(requestToEdit.endTime);
      setPositionId(requestToEdit.positionId || "");
    } else {
      setStartTime("09:00");
      setEndTime("17:00");
      setPositionId("");
    }
  }, [requestToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionId) {
      toast.error("役職を選択してください。");
      return;
    }
    onSubmit({ startTime, endTime, positionId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {requestToEdit ? "シフト申請を編集" : "シフト申請を提出"}
        </h3>
        {selectedDate && (
          <p className="text-sm text-gray-600 mb-4">
            日付: {format(selectedDate, "yyyy年M月d日", { locale: ja })}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              役職
            </label>
            <select
              value={positionId || ""}
              onChange={(e) => setPositionId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">役職を選択してください ({positions.length}件)</option>
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始時間
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了時間
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {requestToEdit ? "更新" : "提出"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ShiftRequestPage = () => {
  const { data: session } = useSession();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [positions, setPositions] = useState<Position[]>([]);
  const [requiredStaff, setRequiredStaff] = useState<RequiredStaffWithPosition[]>([]);
  const [shiftRequests, setShiftRequests] = useState<ShiftRequestWithUserAndPosition[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [requestToEdit, setRequestToEdit] = useState<ShiftRequestWithUserAndPosition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      const [
        requiredStaffResponse,
        positionsResponse,
        shiftRequestsResponse,
      ] = await Promise.all([
        fetch("/api/required-staff"),
        fetch("/api/positions"),
        fetch(`/api/shift-requests?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`),
      ]);

      if (!requiredStaffResponse.ok) {
        throw new Error(`Required Staff API failed: ${requiredStaffResponse.status}`);
      }
      if (!positionsResponse.ok) {
        throw new Error(`Positions API failed: ${positionsResponse.status}`);
      }
      if (!shiftRequestsResponse.ok) {
        throw new Error(`Shift Requests API failed: ${shiftRequestsResponse.status}`);
      }
      
      const requiredStaffData: RequiredStaffWithPosition[] = await requiredStaffResponse.json();
      const positionsData: Position[] = await positionsResponse.json();
      const shiftRequestsData: ShiftRequestWithUserAndPosition[] = await shiftRequestsResponse.json();

      setPositions(positionsData);
      setRequiredStaff(requiredStaffData);
      setShiftRequests(shiftRequestsData);

    } catch (error: unknown) {
      console.error("Error fetching data:", error);
      toast.error(`データの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [currentMonth]);

  useEffect(() => {
    if (session) {
    fetchAllData();
    }
  }, [session, fetchAllData]);

  const handleOpenModalForNew = (date: Date) => {
    setSelectedDate(date);
    setRequestToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (request: ShiftRequestWithUserAndPosition) => {
    if (request.status === 'approved') {
        toast.info("承認済みの希望は変更できません。管理者に連絡してください。");
        return;
    }
    setRequestToEdit(request);
    setSelectedDate(new Date(request.date));
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setRequestToEdit(null);
  };

  const handleShiftRequestCreate = async (data: { startTime: string; endTime: string, positionId: string }) => {
    if (!selectedDate || !session?.user?.id) return;

    try {
      const response = await fetch('/api/shift-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: session.user.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          positionId: data.positionId,
          startTime: data.startTime,
          endTime: data.endTime,
        }),
      });

      if (response.ok) {
        toast.success('希望シフトを提出しました。');
        await fetchAllData();
        handleCloseModal();
      } else {
        const errorData = await response.json();
        toast.error(`提出に失敗しました: ${errorData.error}`);
      }
    } catch (error: unknown) {
      toast.error(`エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleShiftRequestUpdate = async (id: string, data: { startTime: string, endTime: string, positionId: string }) => {
    try {
        const response = await fetch(`/api/shift-requests/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
        if (response.ok) {
            toast.success('希望シフトを更新しました。');
      await fetchAllData();
            handleCloseModal();
        } else {
            const errorData = await response.json();
            toast.error(`更新に失敗しました: ${errorData.error}`);
        }
    } catch (error: unknown) {
        toast.error(`エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleShiftRequestDelete = async (id: string) => {
      try {
          const response = await fetch(`/api/shift-requests/${id}`, { method: 'DELETE' });
        if (response.status === 204) { // DELETE returns 204 No Content
            toast.success('希望シフトを削除しました。');
          await fetchAllData();
            handleCloseModal();
        } else {
            const errorData = await response.json();
            toast.error(`削除に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
    } catch (error: unknown) {
        toast.error(`エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { locale: ja });
    const endDate = endOfWeek(monthEnd, { locale: ja });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const getRequestsForDate = (date: Date) => {
    return shiftRequests.filter(req => isSameDay(new Date(req.date), date));
  };
  
  const getRequiredCountForDate = (date: Date) => {
     const dayOfWeek = getDay(date);
     const rules = requiredStaff.filter(r => r.dayOfWeek === dayOfWeek);
     return rules.reduce((acc, rule) => acc + rule.count, 0);
  }

  const availableTimeSlotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = getDay(selectedDate);
    return requiredStaff
      .filter(rs => rs.dayOfWeek === dayOfWeek)
      .map(rs => rs.timeSlot)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [selectedDate, requiredStaff]);

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
       {isModalOpen && selectedDate && (
         <EmployeeShiftRequestModal
           isOpen={isModalOpen}
           onClose={handleCloseModal}
           onCreate={handleShiftRequestCreate}
           onUpdate={handleShiftRequestUpdate}
           onDelete={handleShiftRequestDelete}
           date={selectedDate}
           positions={positions}
           requestToEdit={requestToEdit}
           availableTimeSlots={availableTimeSlotsForDate}
         />
       )}

      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href = '/employee/dashboard'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            HOME
          </button>
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            &lt; 前月
          </button>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          {format(currentMonth, "yyyy年 MMMM", { locale: ja })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
           className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
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
          const requestsOnDay = getRequestsForDate(day);
          const requiredCount = getRequiredCountForDate(day);
          const isToday = isSameDay(day, new Date());
          const rulesForDay = requiredStaff.filter(r => r.dayOfWeek === getDay(day));
          const requestsByPosition = requestsOnDay.reduce((acc, req) => {
            if (req.positionId) {
              acc[req.positionId] = (acc[req.positionId] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);

          return (
            <div key={day.toString()} className="aspect-[3/4]">
              <div
                className={`p-2 h-full flex flex-col relative group transition-all duration-200 ease-in-out border-t
                  ${isCurrentMonth ? "bg-white" : "bg-gray-100 text-gray-400"}
                `}
                onClick={() => handleOpenModalForNew(day)}
              >
                <div className="flex justify-between items-start">
                    <span
                      className={`text-sm font-medium ${isToday ? "flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full" : "text-gray-900" } ${!isCurrentMonth && "text-gray-400"}`}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="text-xs text-right">
                       <span className={`font-bold ${requestsOnDay.length >= requiredCount && requiredCount > 0 ? "text-green-600" : "text-red-500"}`}>
                         {requestsOnDay.length}
                       </span>
                       <span className="text-gray-500"> / {requiredCount}</span>
                    </div>
                </div>

                {/* Position-specific required staff */}
                <div className="flex flex-wrap gap-1 mt-1 text-[8px]">
                  {rulesForDay.map(rule => {
                    const placed = requestsByPosition[rule.positionId] || 0;
                    const required = rule.count;
                    const isDeficient = placed < required;
                    return (
                      <div key={rule.id} className={`px-1 py-0.5 rounded-full text-white ${isDeficient ? 'bg-orange-500' : 'bg-green-500'}`}>
                        {rule.position?.name || 'Unknown'}: {placed}/{required}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-1 pt-1 border-t border-gray-100 flex-grow overflow-y-auto text-xs space-y-1">
                   {requestsOnDay.map(req => {
                      const currentUserId = session?.user?.id;
                      const isOwner = currentUserId && req.user.id === currentUserId;
                       return (
                       <div 
                          key={req.id} 
                          onClick={(e) => {
                              if (isOwner) {
                                  e.stopPropagation();
                                  handleOpenModalForEdit(req);
                              }
                          }}
                          className={`rounded p-1 truncate ${isOwner ? 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200' : 'bg-blue-100 text-blue-800'}`} 
                          title={`${req.user?.name || 'Unknown'}: ${req.position?.name || 'Unknown'} ${req.startTime}-${req.endTime}`}
                       >
                           <span className="font-semibold">{req.user?.name || 'Unknown'}</span>
                           <span className="text-gray-600"> ({req.position?.name || 'Unknown'})</span>
                       </div>
                   )})}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* シフト申請モーダル */}
      <ShiftRequestModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={(data) => {
          if (requestToEdit) {
            handleShiftRequestUpdate(requestToEdit.id, data);
          } else {
            handleShiftRequestCreate(data);
          }
        }}
        positions={positions}
        selectedDate={selectedDate}
        requestToEdit={requestToEdit}
      />
    </div>
  );
};

export default ShiftRequestPage;