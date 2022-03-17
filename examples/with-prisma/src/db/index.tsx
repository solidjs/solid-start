import P from "@prisma/client";
const { PrismaClient } = P;

export const db = new PrismaClient();

db.$connect();
