import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// .env ファイルの絶対パスを解決し、強制的に読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: https://pris.ly/d/help/next-js-best-practices

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
