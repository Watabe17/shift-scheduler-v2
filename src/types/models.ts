// src/types/models.ts
import { User as PrismaUser, Position as PrismaPosition, RequiredStaff as PrismaRequiredStaff, ShiftRequest as PrismaShiftRequest, Shift as PrismaShift, Employee as PrismaEmployee, SalesData as PrismaSalesData, ShiftStatus } from '@prisma/client';

export type User = PrismaUser;
export type Position = PrismaPosition;
export type RequiredStaff = PrismaRequiredStaff;
export type ShiftRequest = PrismaShiftRequest;
export type Shift = PrismaShift;
export type Employee = PrismaEmployee;
export type SalesData = PrismaSalesData;
export { ShiftStatus };

// 必要に応じて、Prismaのモデルにはないがアプリケーション固有の型をここに追加
// 例: シフト作成画面で使う従業員の情報など
export type EmployeeWithPositions = Employee & {
  positions: Position[];
};

export type PositionWithStaff = Position & {
  requiredStaffs: RequiredStaff[];
};
