"use server";

import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { revalidatePath } from 'next/cache';

// ユーザー登録
export async function registerUser(name: string, password: string, role: string = "STAFF"): Promise<{ success: boolean, error?: string }> {
    try {
        const existing = await prisma.user.findUnique({ where: { name } });
        if (existing) {
            return { success: false, error: "この名前は既に使用されています" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                password: hashedPassword,
                role,
            },
        });

        revalidatePath('/shift-create/admin');
        return { success: true };
    } catch (error) {
        console.error("User registration error:", error);
        return { success: false, error: "ユーザー登録に失敗しました" };
    }
}

// ユーザー更新（名前・パスワード）
export async function updateUser(id: number, name: string, password?: string): Promise<{ success: boolean, error?: string }> {
    try {
        // 名前変更の場合、重複チェック
        const existing = await prisma.user.findUnique({ where: { name } });
        if (existing && existing.id !== id) {
            return { success: false, error: "この名前は既に使用されています" };
        }

        const data: any = { name };
        if (password && password.trim() !== "") {
            data.password = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({
            where: { id },
            data,
        });

        revalidatePath('/shift-create/admin');
        return { success: true };
    } catch (error) {
        console.error("User update error:", error);
        return { success: false, error: "ユーザー情報の更新に失敗しました" };
    }
}

// ユーザー削除
export async function deleteUser(id: number): Promise<{ success: boolean, error?: string }> {
    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/shift-create/admin');
        return { success: true };
    } catch (error) {
        console.error("User deletion error:", error);
        return { success: false, error: "ユーザー削除に失敗しました" };
    }
}
