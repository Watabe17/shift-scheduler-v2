// DBスキーマに基づく型定義
export type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  positions: Position[];
}; 

export type Position = {
  id: string;
  name: string;
};

export type ShiftRequest = {
  id: string;
  userId: string;
  positionId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RequiredStaff = {
  id: string;
  positionId: string;
  dayOfWeek: number;
  timeSlot: string;
  count: number;
};

export type PositionWithStaff = Position & {
  requiredStaffs: RequiredStaff[];
}; 

export type ShiftStatus = 'DRAFT' | 'CONFIRMED';

export const ShiftStatus = {
  DRAFT: 'DRAFT' as const,
  CONFIRMED: 'CONFIRMED' as const,
} as const; 

export type Shift = {
  id: string;
  userId: string;
  positionId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}; 