"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, LogOut, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useStaff } from './context/StaffContext';
import { logout } from './actions/authActions';
import { isHoliday, getHolidayName } from './utils/holidays';

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
    return new Date(year, month - 1, day).getDay();
}

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const DOW_COLORS = ["text-red-500", "", "", "", "", "", "text-blue-500"];
const DOW_BG = ["bg-red-50", "", "", "", "", "", "bg-blue-50"];

function getDayTextColor(year: number, month: number, day: number): string {
    const dow = new Date(year, month - 1, day).getDay();
    if (dow === 0 || isHoliday(year, month, day)) return "text-red-500";
    if (dow === 6) return "text-blue-500";
    return "";
}

function getDayBg(year: number, month: number, day: number): string {
    const dow = new Date(year, month - 1, day).getDay();
    if (dow === 0 || isHoliday(year, month, day)) return "bg-red-50";
    if (dow === 6) return "bg-blue-50";
    return "";
}

function shortTimeLabel(time: string): string {
    if (time === "10:00") return "10:00-14:00";
    if (time === "10:30") return "10:30-14:30";
    if (time === "11:00") return "11:00-15:00";
    return time;
}

function timeColor(time: string): string {
    if (time === "10:00") return "bg-emerald-500 text-white";
    if (time === "10:30") return "bg-amber-500 text-white";
    if (time === "11:00") return "bg-rose-500 text-white";
    return "bg-gray-200";
}

export default function ShiftCalendar() {
    const { user, allShifts, staffList, loading } = useStaff();

    const [year, setYear] = useState(2026);
    const [month, setMonth] = useState(2);

    if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-orange-600">読み込み中...</div>;

    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = getDayOfWeek(year, month, 1);

    const prevMonth = () => {
        if (month === 1) { setYear(year - 1); setMonth(12); }
        else setMonth(month - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setYear(year + 1); setMonth(1); }
        else setMonth(month + 1);
    };

    const calendarCells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) calendarCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

    const getShiftsForDay = (day: number) => {
        const date = `${year}-${month}-${day}`;
        // パートの確定時間 + 店長の出勤（○）を表示
        const dayShifts = allShifts.filter(s => s.date === date);
        const result: typeof allShifts = [];
        for (const s of dayShifts) {
            const staff = staffList.find(st => st.id === s.userId);

            // 表示条件: 
            // - 管理人(ADMIN)または店長(MANAGER)は全てのシフトを閲覧可能
            // - パート(USER)または未ログイン時の場合は、自身のシフトのみを閲覧可能にする
            //   ※ 未ログインの場合は user?.userId が存在しないため誰も表示されない
            const canView = user?.role === "ADMIN" || user?.role === "MANAGER" || s.userId === user?.userId;

            if (!canView) continue;

            if (staff?.role === "MANAGER" && s.available) {
                // 店長は出勤マークとして表示
                result.push({ ...s, time: "出勤" });
            } else if (s.time) {
                result.push(s);
            }
        }
        return result;
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="min-h-screen bg-stone-50 p-2 sm:p-4 md:p-8 text-slate-900">
            <div className="max-w-6xl mx-auto">

                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-sm border-t-4 border-orange-600">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-orange-600">ラーメン大吉・オムランカ シフト表</h1>
                        <p className="text-gray-400 text-xs">確定済みシフトのカレンダー表示</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {user ? (
                            <>
                                <span className="text-xs text-gray-500">{user.name}（{user.role === "ADMIN" ? "管理人" : user.role === "MANAGER" ? "店長" : "パート"}）</span>
                                <Link
                                    href={user.role === "ADMIN" ? "/shift-create/admin" : "/shift-create"}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-orange-700 transition-all shadow-md text-sm"
                                >
                                    <CalendarDays size={16} />
                                    {user.role === "ADMIN" ? "シフト管理" : "シフト希望"}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="bg-gray-400 text-white px-3 py-2 rounded-full flex items-center gap-1 hover:bg-gray-500 transition-all text-sm"
                                >
                                    <LogOut size={14} />
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="bg-orange-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-orange-700 transition-all shadow-md text-sm"
                            >
                                <LogIn size={16} />
                                ログイン
                            </Link>
                        )}
                    </div>
                </header>

                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-stone-200">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-orange-100 active:bg-orange-200 transition-colors">
                        <ChevronLeft size={20} className="text-orange-600" />
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold text-orange-700 min-w-[130px] sm:min-w-[150px] text-center">
                        {year}年 {month}月
                    </h2>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-orange-100 active:bg-orange-200 transition-colors">
                        <ChevronRight size={20} className="text-orange-600" />
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-stone-200 overflow-x-auto">
                    <div className="min-w-[480px]">
                        <div className="grid grid-cols-7 border-b bg-stone-50">
                            {DOW_LABELS.map((label, i) => (
                                <div key={label} className={`p-2 sm:p-3 text-center text-xs sm:text-sm font-bold ${DOW_COLORS[i]}`}>
                                    {label}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {calendarCells.map((day, idx) => {
                                if (day === null) {
                                    return <div key={`empty-${idx}`} className="min-h-[80px] sm:min-h-[120px] border-b border-r border-stone-100 bg-stone-50/50"></div>;
                                }

                                const dow = getDayOfWeek(year, month, day);
                                const shifts = getShiftsForDay(day);
                                const bgClass = getDayBg(year, month, day);
                                const textColor = getDayTextColor(year, month, day);
                                const holidayName = getHolidayName(year, month, day);

                                return (
                                    <div key={day} className={`min-h-[80px] sm:min-h-[120px] border-b border-r border-stone-100 p-1 sm:p-2 ${bgClass} hover:bg-orange-50/30 transition-colors`}>
                                        <div className={`text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 ${textColor || DOW_COLORS[dow]}`}>
                                            {day}
                                        </div>
                                        {holidayName && (
                                            <div className="text-[7px] sm:text-[8px] text-red-400 leading-tight mb-0.5">{holidayName}</div>
                                        )}
                                        <div className="space-y-0.5 sm:space-y-1">
                                            {shifts.map((s, i) => (
                                                <div key={i} className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded ${s.time === "出勤" ? "bg-blue-400 text-white" : timeColor(s.time!)} leading-tight`}>
                                                    <span className="block sm:inline">{s.userName}</span>
                                                    <span className="opacity-80 block sm:inline"> {s.time === "出勤" ? "出勤" : shortTimeLabel(s.time!)}</span>
                                                    {s.isCurry && <span className="ml-0.5" title="カレー出勤">🍛</span>}
                                                </div>
                                            ))}
                                            {shifts.length === 0 && (
                                                <div className="text-[8px] sm:text-[10px] text-gray-300 italic">—</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-3 sm:mt-4 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-stone-200">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded inline-block"></span> 10:00-14:00</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded inline-block"></span> 10:30-14:30</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-500 rounded inline-block"></span> 11:00-15:00</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded inline-block"></span> 店長出勤</div>
                </div>
            </div>
        </div>
    );
}
