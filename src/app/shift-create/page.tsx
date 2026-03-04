"use client";

import React, { useState } from 'react';
import { User, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useStaff } from '../context/StaffContext';
import { logout } from '../actions/authActions';
import { useRouter } from 'next/navigation';
import { isHoliday, getHolidayName } from '../utils/holidays';

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): string {
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return days[new Date(year, month - 1, day).getDay()];
}

function getDayColor(year: number, month: number, day: number): string {
    const dow = new Date(year, month - 1, day).getDay();
    if (dow === 0 || isHoliday(year, month, day)) return "text-red-500";
    if (dow === 6) return "text-blue-500";
    return "text-gray-700";
}

export default function StaffShiftPage() {
    const { user, myShifts, loading, toggleAvailability } = useStaff();
    const router = useRouter();

    const [year, setYear] = useState(() => new Date().getFullYear());
    const [month, setMonth] = useState(() => new Date().getMonth() + 1);

    if (loading) return <div className="min-h-screen bg-orange-50 flex items-center justify-center text-orange-600">読み込み中...</div>;

    if (!user) {
        router.push('/login');
        return null;
    }

    if (user.role === "ADMIN") {
        router.push('/shift-create/admin');
        return null;
    }

    const daysInMonth = getDaysInMonth(year, month);
    const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const prevMonth = () => {
        if (month === 1) { setYear(year - 1); setMonth(12); }
        else setMonth(month - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setYear(year + 1); setMonth(1); }
        else setMonth(month + 1);
    };

    const getMyShift = (day: number) => {
        const date = `${year}-${month}-${day}`;
        return myShifts.find(s => s.date === date);
    };

    const handleToggle = (day: number) => {
        const date = `${year}-${month}-${day}`;
        const current = getMyShift(day);
        const newAvailable = current ? !current.available : true;
        toggleAvailability(date, newAvailable);
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="min-h-screen bg-orange-50 p-2 sm:p-4 md:p-8 text-slate-900">
            <div className="max-w-3xl mx-auto">

                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-sm border-t-4 border-orange-600">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-orange-600">
                            <span className="flex items-center gap-2">
                                <User size={22} className="text-orange-500" />
                                {user.name} さんのシフト希望
                            </span>
                        </h1>
                        <p className="text-gray-400 text-xs mt-1">出勤できる日を ○ にしてください</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Link href="/" className="text-orange-600 hover:text-orange-800 text-xs sm:text-sm underline flex items-center">
                            カレンダー
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-500 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-gray-600 transition-all shadow-md text-sm flex-1 sm:flex-none justify-center"
                        >
                            <LogOut size={16} />
                            ログアウト
                        </button>
                    </div>
                </header>

                {/* 月切り替え */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-orange-100">
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

                {/* シフト希望テーブル */}
                <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-orange-100 -mx-2 sm:mx-0">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-orange-100">
                                <th className="p-2 sm:p-3 border-b border-orange-200 text-left w-16 sm:w-24 sticky left-0 z-20 bg-orange-100 text-xs sm:text-sm">日付</th>
                                {DAYS.map(day => {
                                    const dow = getDayOfWeek(year, month, day);
                                    const color = getDayColor(year, month, day);
                                    return (
                                        <th key={day} className={`p-1 sm:p-2 border-b border-orange-200 text-center min-w-[60px] sm:min-w-[80px] ${color}`}>
                                            <div className="text-xs sm:text-sm font-bold">{month}/{day}</div>
                                            <div className="text-[10px] sm:text-xs font-normal">({dow})</div>
                                            {getHolidayName(year, month, day) && (
                                                <div className="text-[8px] text-red-400 font-normal leading-tight">{getHolidayName(year, month, day)}</div>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-2 sm:p-3 border-b font-bold bg-white sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-1">
                                        <User size={14} className="text-orange-400" />
                                        <span className="text-xs sm:text-sm">{user.name}</span>
                                    </div>
                                </td>
                                {DAYS.map(day => {
                                    const shift = getMyShift(day);
                                    const isAvailable = shift?.available === true;
                                    const isUnavailable = shift?.available === false;
                                    return (
                                        <td key={day} className="p-0.5 sm:p-1 border-b border-orange-50 text-center">
                                            <button
                                                onClick={() => handleToggle(day)}
                                                disabled={!!shift?.time}
                                                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-bold transition-all text-sm sm:text-base ${shift?.time ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                                                    } ${isAvailable ? "bg-green-100 text-green-600 scale-110" :
                                                        isUnavailable ? "bg-red-100 text-red-600" :
                                                            "bg-gray-100 text-gray-400"
                                                    }`}
                                            >
                                                {isAvailable ? "○" : isUnavailable ? "×" : "-"}
                                            </button>
                                            {shift?.time && (
                                                <div className="text-[8px] sm:text-[9px] mt-1 bg-orange-100 text-orange-700 rounded px-1 py-0.5 font-bold flex items-center justify-center gap-0.5">
                                                    {shift.time === "10:00" ? "10:00-14:00" : shift.time === "10:30" ? "10:30-14:30" : shift.time === "11:00" ? "11:00-15:00" : shift.time}
                                                    {shift.isCurry && <span title="カレー出勤">🍛</span>}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-orange-100">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded-full inline-block"></span> 未回答</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded-full inline-block"></span> 出勤可能（○）</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded-full inline-block"></span> 出勤不可（×）</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-100 rounded-full inline-block"></span> 確定済み時間</div>
                </div>
            </div>
        </div>
    );
}
