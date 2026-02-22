"use server";

import { prisma } from '../../../lib/prisma';

// --- 従業員用: シフト希望の提出 ---
export async function setAvailability(userId: number, date: string, available: boolean) {
    await prisma.shift.upsert({
        where: { userId_date: { userId, date } },
        update: { available },
        create: { userId, date, available, time: null, isCurry: false },
    });
}

// --- カレー/ラーメン出勤の切り替え ---
export async function toggleCurry(userId: number, date: string, isCurry: boolean) {
    await prisma.shift.upsert({
        where: { userId_date: { userId, date } },
        update: { isCurry },
        create: { userId, date, available: true, time: null, isCurry },
    });
}

// --- 管理者用: 出勤時間の確定 ---
export async function confirmShift(userId: number, date: string, time: string | null) {
    await prisma.shift.upsert({
        where: { userId_date: { userId, date } },
        update: { time },
        create: { userId, date, available: true, time, isCurry: false },
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
        isCurry: s.isCurry,
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
        isCurry: s.isCurry,
    }));
}

// --- 全ユーザー取得（スタッフリスト用） ---
export async function getStaffList() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, role: true },
        orderBy: { id: 'asc' },
    });
    return users.sort((a, b) => {
        if (a.role === "MANAGER" && b.role !== "MANAGER") return -1;
        if (b.role === "MANAGER" && a.role !== "MANAGER") return 1;
        return a.id - b.id;
    });
}
