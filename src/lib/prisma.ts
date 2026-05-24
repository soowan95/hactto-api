import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  PrismaClient,
  WinningNumber as OriginalWinningNumber,
  AlgorithmResult as OriginalAlgorithmResult,
} from '../generated/prisma/client';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});
const basePrisma = new PrismaClient({ adapter });

const createNumberArrayGetter = (obj: {
  first: number;
  second: number;
  third: number;
  fourth: number;
  fifth: number;
  sixth: number;
  bonus: number;
}) => {
  return () => [
    obj.first,
    obj.second,
    obj.third,
    obj.fourth,
    obj.fifth,
    obj.sixth,
    obj.bonus,
  ];
};

const needsFields = {
  first: true,
  second: true,
  third: true,
  fourth: true,
  fifth: true,
  sixth: true,
  bonus: true,
} as const;

const prisma = basePrisma.$extends({
  result: {
    winningNumber: {
      getNumberArray: {
        needs: needsFields,
        compute: createNumberArrayGetter,
      },
    },
    algorithmResult: {
      getNumberArray: {
        needs: needsFields,
        compute: createNumberArrayGetter,
      },
    },
  },
});

export type WinningNumber = OriginalWinningNumber & {
  getNumberArray: () => number[];
};

export type AlgorithmResult = OriginalAlgorithmResult & {
  getNumberArray: () => number[];
};

export { prisma };
