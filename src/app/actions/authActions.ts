"use server";

import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { createSession, deleteSession, getSession, SessionPayload } from '../../../lib/auth';
import { redirect } from 'next/navigation';

// ログイン
export async function login(name: string, password: string): Promise<{ error?: string }> {
    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) {
        return { error: "ユーザーが見つかりません" };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        return { error: "パスワードが正しくありません" };
    }

    await createSession({
        userId: user.id,
        name: user.name,
        role: user.role,
    });

    return {};
}

// ログアウト
export async function logout() {
    await deleteSession();
    redirect('/login');
}

// 現在のログインユーザー情報を取得
export async function getCurrentUser(): Promise<SessionPayload | null> {
    return await getSession();
}

// 登録済みユーザー名一覧を取得（ログイン画面のプルダウン用）
export async function getUserNames(): Promise<string[]> {
    const users = await prisma.user.findMany({
        select: { name: true },
        orderBy: { id: 'asc' },
    });
    return users.map(u => u.name);
}
