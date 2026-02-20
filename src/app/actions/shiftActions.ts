"use server";

import { prisma } from '../../../lib/prisma';

// --- 従業員用: シフト希望の提出 ---
export async function setAvailability(userId: number, date: string, available: boolean) {
    await prisma.shift.upsert({
        where: { userId_date: { userId, date } },
        update: { available },
        create: { userId, date, available, time: null },
    });
}

// --- 管理者用: 出勤時間の確定 ---
export async function confirmShift(userId: number, date: string, time: string | null) {
    await prisma.shift.upsert({
        where: { userId_date: { userId, date } },
        update: { time },
        create: { userId, date, available: true, time },
    });
}

// --- 全シフトデータ取得（管理者/カレンダー用） ---
export async function getAllShifts() {
    const shifts = await prisma.shift.findMany({
        include: { user: { select: { id: true, name: true } } },
    });
    return shifts.map(s => ({
        userId: s.userId,
        userName: s.user.name,
        date: s.date,
        available: s.available,
        time: s.time,
    }));
}

// --- 特定ユーザーのシフトデータ取得（従業員用） ---
export async function getMyShifts(userId: number) {
    const shifts = await prisma.shift.findMany({
        where: { userId },
    });
    return shifts.map(s => ({
        date: s.date,
        available: s.available,
        time: s.time,
    }));
}

// --- 全ユーザー取得（スタッフリスト用） ---
export async function getStaffList() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, role: true },
        orderBy: { id: 'asc' },
    });
    return users;
}
