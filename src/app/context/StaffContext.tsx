"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSession, SessionPayload } from '../../../lib/auth';
import { getCurrentUser } from '../actions/authActions';
import { getAllShifts, getMyShifts, getStaffList, setAvailability, confirmShift } from '../actions/shiftActions';
import { registerUser, updateUser, deleteUser } from '../actions/userActions';

export interface UserInfo {
    userId: number;
    name: string;
    role: string;
}

export interface ShiftItem {
    userId: number;
    userName: string;
    date: string;
    available: boolean;
    time: string | null;
}

export interface StaffInfo {
    id: number;
    name: string;
    role: string;
}

interface StaffContextType {
    user: UserInfo | null;
    staffList: StaffInfo[];
    allShifts: ShiftItem[];
    myShifts: { date: string; available: boolean; time: string | null }[];
    loading: boolean;
    toggleAvailability: (date: string, available: boolean) => void;
    adminSetAvailability: (userId: number, date: string, available: boolean) => void;
    setConfirmTime: (userId: number, date: string, time: string | null) => void;
    registerStaff: (name: string, password: string, role?: string) => Promise<boolean>;
    updateStaff: (id: number, name: string, password?: string) => Promise<boolean>;
    deleteStaff: (id: number) => Promise<boolean>;
    refreshData: () => Promise<void>;
}

const StaffContext = createContext<StaffContextType | null>(null);

export function useStaff() {
    const ctx = useContext(StaffContext);
    if (!ctx) throw new Error("useStaff must be used within StaffProvider");
    return ctx;
}

export function StaffProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [staffList, setStaffList] = useState<StaffInfo[]>([]);
    const [allShifts, setAllShifts] = useState<ShiftItem[]>([]);
    const [myShifts, setMyShifts] = useState<{ date: string; available: boolean; time: string | null }[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            if (!currentUser) {
                setLoading(false);
                return;
            }

            const staff = await getStaffList();
            setStaffList(staff);

            // 全ユーザーのシフトを取得（カレンダー表示用 + 管理者用）
            const shifts = await getAllShifts();
            setAllShifts(shifts);

            const mine = await getMyShifts(currentUser.userId);
            setMyShifts(mine);

            setLoading(false);
        } catch (err) {
            console.error("データ読み込みエラー:", err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 従業員: 自分の○/×を切り替え
    const toggleAvailability = useCallback((date: string, available: boolean) => {
        if (!user) return;

        // ローカル即時更新
        setMyShifts(prev => {
            const exists = prev.find(s => s.date === date);
            if (exists) {
                return prev.map(s => s.date === date ? { ...s, available } : s);
            }
            return [...prev, { date, available, time: null }];
        });

        // 全体シフトも更新
        setAllShifts(prev => {
            const exists = prev.find(s => s.userId === user.userId && s.date === date);
            if (exists) {
                return prev.map(s => s.userId === user.userId && s.date === date ? { ...s, available } : s);
            }
            return [...prev, { userId: user.userId, userName: user.name, date, available, time: null }];
        });

        // DB保存
        setAvailability(user.userId, date, available).catch(err =>
            console.error("希望保存エラー:", err)
        );
    }, [user]);

    // 管理者: 他ユーザーの○/×を変更
    const adminSetAvailability = useCallback((userId: number, date: string, available: boolean) => {
        // allShiftsを更新
        setAllShifts(prev => {
            const exists = prev.find(s => s.userId === userId && s.date === date);
            if (exists) {
                return prev.map(s => s.userId === userId && s.date === date ? { ...s, available } : s);
            }
            const staff = staffList.find(s => s.id === userId);
            return [...prev, { userId, userName: staff?.name || "", date, available, time: null }];
        });

        // 自分のmyShiftsも更新（自分のデータの場合）
        if (user && userId === user.userId) {
            setMyShifts(prev => {
                const exists = prev.find(s => s.date === date);
                if (exists) {
                    return prev.map(s => s.date === date ? { ...s, available } : s);
                }
                return [...prev, { date, available, time: null }];
            });
        }

        // DB保存
        setAvailability(userId, date, available).catch(err =>
            console.error("希望変更エラー:", err)
        );
    }, [user, staffList]);

    // ユーザー管理: 登録
    const registerStaff = useCallback(async (name: string, password: string, role: string = "STAFF") => {
        const result = await registerUser(name, password, role);
        if (result.success) {
            await loadData(); // リスト更新
            return true;
        }
        console.error(result.error);
        return false;
    }, [loadData]);

    // ユーザー管理: 更新
    const updateStaff = useCallback(async (id: number, name: string, password?: string) => {
        const result = await updateUser(id, name, password);
        if (result.success) {
            await loadData();
            return true;
        }
        console.error(result.error);
        return false;
    }, [loadData]);

    // ユーザー管理: 削除
    const deleteStaff = useCallback(async (id: number) => {
        const result = await deleteUser(id);
        if (result.success) {
            await loadData();
            return true;
        }
        console.error(result.error);
        return false;
    }, [loadData]);


    // 管理者: 出勤時間を確定
    const setConfirmTime = useCallback((userId: number, date: string, time: string | null) => {
        // ローカル即時更新
        setAllShifts(prev => {
            const exists = prev.find(s => s.userId === userId && s.date === date);
            if (exists) {
                return prev.map(s => s.userId === userId && s.date === date ? { ...s, time } : s);
            }
            const staff = staffList.find(s => s.id === userId);
            return [...prev, { userId, userName: staff?.name || "", date, available: true, time }];
        });

        // DB保存
        confirmShift(userId, date, time).catch(err =>
            console.error("シフト確定エラー:", err)
        );
    }, [staffList]);

    return (
        <StaffContext.Provider value={{
            user, staffList, allShifts, myShifts, loading,
            toggleAvailability, adminSetAvailability, setConfirmTime,
            registerStaff, updateStaff, deleteStaff,
            refreshData: loadData
        }}>
            {children}
        </StaffContext.Provider>
    );
}
