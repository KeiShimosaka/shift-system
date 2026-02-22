"use client";

import React, { useState } from 'react';
import { User, ChevronLeft, ChevronRight, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useStaff } from '../../context/StaffContext';
import { logout } from '../../actions/authActions';
import { useRouter } from 'next/navigation';
import UserManagementModal from '../../components/UserManagementModal';
import { isHoliday, getHolidayName, isNonWorkday } from '../../utils/holidays';

const TIME_BLOCKS = [
    { label: "10:00-14:00", value: "10:00" },
    { label: "10:30-14:30", value: "10:30" },
    { label: "11:00-15:00", value: "11:00" },
];

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

// 人数判定ロジック
function getStaffCountStatus(year: number, month: number, day: number, count: number, curryCount: number, ramenCount: number): { text: string; color: string; detail: string } {
    const dow = new Date(year, month - 1, day).getDay();

    // 水曜日は店長含めて3人でOK (内訳問わず)
    if (dow === 3) {
        if (count === 3) return { text: "OK", color: "bg-green-100 text-green-700", detail: `${count}` };
        if (count > 3) return { text: "多い", color: "bg-blue-100 text-blue-700", detail: `${count}` };
        return { text: "少ない", color: "bg-red-100 text-red-700", detail: `${count}` };
    }

    const isHolidayOrWeekend = isNonWorkday(year, month, day);
    const targetCurry = 2;
    const targetRamen = isHolidayOrWeekend ? 4 : 3;

    const curryOk = curryCount >= targetCurry;
    const ramenOk = ramenCount >= targetRamen;
    const bothOk = curryOk && ramenOk;

    const detailText = `🍛${curryCount}/🍜${ramenCount}`;

    if (bothOk) {
        if (curryCount > targetCurry || ramenCount > targetRamen) {
            return { text: "多い", color: "bg-blue-100 text-blue-700", detail: detailText };
        }
        return { text: "OK", color: "bg-green-100 text-green-700", detail: detailText };
    }
    return { text: "少ない", color: "bg-red-100 text-red-700", detail: detailText };
}

export default function AdminShiftPage() {
    const { user, staffList, allShifts, loading, setConfirmTime, adminSetAvailability, adminToggleCurry } = useStaff();
    const router = useRouter();

    const [year, setYear] = useState(2026);
    const [month, setMonth] = useState(2);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    if (loading) return <div className="min-h-screen bg-orange-50 flex items-center justify-center text-orange-600">読み込み中...</div>;

    if (!user) {
        router.push('/login');
        return null;
    }

    if (user.role !== "ADMIN") {
        router.push('/shift-create');
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

    const getShiftFor = (userId: number, day: number) => {
        const date = `${year}-${month}-${day}`;
        return allShifts.find(s => s.userId === userId && s.date === date);
    };

    // ○/×切り替え（管理者権限）
    const handleToggleAvailability = (userId: number, day: number) => {
        const date = `${year}-${month}-${day}`;
        const current = getShiftFor(userId, day);
        // 現在が true なら false、それ以外(false/null)なら true に切り替え
        const newAvailable = !(current?.available === true);
        adminSetAvailability(userId, date, newAvailable);
    };

    const handleSetTime = (userId: number, day: number, time: string) => {
        const date = `${year}-${month}-${day}`;
        const current = getShiftFor(userId, day);
        const newTime = current?.time === time ? null : time;
        setConfirmTime(userId, date, newTime);
    };

    const handleLogout = async () => {
        await logout();
    };

    // 店長とパートを表示（管理人は除く）
    const staffAndManagers = staffList.filter(s => s.role !== "ADMIN");

    return (
        <div className="min-h-screen bg-orange-50 p-2 sm:p-4 md:p-8 text-slate-900">
            <div className="max-w-full mx-auto">

                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-sm border-t-4 border-red-600">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">管理者</span>
                            <h1 className="text-xl sm:text-2xl font-bold text-orange-600">ラーメン大吉・オムランカ シフト管理</h1>
                        </div>
                        <p className="text-gray-500 text-xs sm:text-sm italic">従業員の希望を確認・変更し、出勤時間を確定してください</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link href="/" className="text-orange-600 hover:text-orange-800 text-sm underline">
                            ← カレンダー
                        </Link>
                        <button
                            onClick={() => setIsUserModalOpen(true)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-orange-600 transition-all shadow-md text-sm flex-1 sm:flex-none justify-center"
                        >
                            <Settings size={16} />
                            ユーザー管理
                        </button>
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

                {/* シフト管理テーブル */}
                <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-orange-100 -mx-2 sm:mx-0">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-orange-100">
                                <th className="p-2 sm:p-3 border-b border-orange-200 text-left w-16 sm:w-24 sticky left-0 z-20 bg-orange-100 text-xs sm:text-sm">日付</th>
                                {DAYS.map(day => {
                                    const dow = getDayOfWeek(year, month, day);
                                    const color = getDayColor(year, month, day);
                                    return (
                                        <th key={day} className={`p-1 sm:p-2 border-b border-orange-200 text-center min-w-[70px] sm:min-w-[90px] ${color}`}>
                                            <div className="text-xs sm:text-sm font-bold">{month}/{day}</div>
                                            <div className="text-[10px] sm:text-xs font-normal">({dow})</div>
                                            {getHolidayName(year, month, day) && (
                                                <div className="text-[8px] text-red-400 font-normal leading-tight">{getHolidayName(year, month, day)}</div>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                            {/* 人数判定行 */}
                            <tr className="bg-orange-50">
                                <td className="p-2 sm:p-3 border-b border-orange-200 font-bold text-gray-600 text-xs sm:text-sm sticky left-0 z-20 bg-orange-50">必要人数</td>
                                {DAYS.map(day => {
                                    // 日ごとの出勤可能人数を計算（店長含む）
                                    const date = `${year}-${month}-${day}`;
                                    const availableStaffs = staffList.filter(s => s.role !== "ADMIN").map(s => {
                                        const shift = allShifts.find(sh => sh.userId === s.id && sh.date === date);
                                        return {
                                            isAvailable: shift?.available === true,
                                            isCurry: shift?.isCurry === true
                                        };
                                    }).filter(s => s.isAvailable);

                                    const count = availableStaffs.length;
                                    const curryCount = availableStaffs.filter(s => s.isCurry).length;
                                    const ramenCount = count - curryCount;

                                    const status = getStaffCountStatus(year, month, day, count, curryCount, ramenCount);

                                    return (
                                        <td key={day} className="p-1 sm:p-2 border-b border-orange-200 text-center">
                                            <div className={`text-[10px] sm:text-[11px] px-0.5 py-0.5 sm:px-1 rounded font-bold whitespace-nowrap ${status.color}`}>
                                                {status.text} <span className="font-normal text-[9px] sm:text-[10px]">({status.detail})</span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {staffAndManagers.map(staff => (
                                <tr key={staff.id} className="hover:bg-orange-50/50 transition-colors">
                                    <td className="p-2 sm:p-3 border-b font-bold bg-white sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center gap-1">
                                            <User size={14} className={`flex-shrink-0 ${staff.role === "MANAGER" ? "text-blue-400" : "text-orange-400"}`} />
                                            <span className="text-xs sm:text-sm truncate max-w-[50px] sm:max-w-none">{staff.name}</span>
                                            {staff.role === "MANAGER" && (
                                                <span className="text-[8px] bg-blue-100 text-blue-600 px-1 rounded">店長</span>
                                            )}
                                        </div>
                                    </td>
                                    {DAYS.map(day => {
                                        const shift = getShiftFor(staff.id, day);
                                        const isAvailable = shift?.available === true;
                                        const isUnavailable = shift?.available === false;
                                        const isManager = staff.role === "MANAGER";
                                        return (
                                            <td key={day} className="p-0.5 sm:p-1 border-b border-orange-50 text-center align-top">
                                                {/* 希望表示（クリックで変更可能に） */}
                                                <button
                                                    onClick={() => handleToggleAvailability(staff.id, day)}
                                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center mx-auto mb-0.5 transition-transform active:scale-95 ${isAvailable ? "bg-green-100 text-green-600 hover:bg-green-200" :
                                                        isUnavailable ? "bg-red-100 text-red-600 hover:bg-red-200" :
                                                            "bg-gray-50 text-gray-300 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    {isAvailable ? "○" : isUnavailable ? "×" : "-"}
                                                </button>

                                                {/* 時間確定ボタン（パートのみ、店長は表示しない） */}
                                                {isAvailable && !isManager && (
                                                    <div className="flex flex-col gap-0.5 sm:gap-1">
                                                        {TIME_BLOCKS.map(block => (
                                                            <button
                                                                key={block.value}
                                                                onClick={() => handleSetTime(staff.id, day, block.value)}
                                                                className={`text-[8px] sm:text-[9px] py-1 px-0.5 sm:px-1 rounded border transition-all leading-tight ${shift?.time === block.value
                                                                    ? "bg-orange-500 text-white border-orange-600 shadow-inner"
                                                                    : "bg-white text-orange-600 border-orange-200 hover:bg-orange-50 active:bg-orange-100"
                                                                    }`}
                                                            >
                                                                {block.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* カレー出勤切り替えボタン（パートは時間が確定している場合のみ、店長は出勤可能なら表示） */}
                                                {isAvailable && (isManager || shift?.time) && (
                                                    <div className="mt-1">
                                                        <button
                                                            onClick={() => adminToggleCurry(staff.id, `${year}-${month}-${day}`, !shift.isCurry)}
                                                            className={`text-[8px] sm:text-[9px] py-1 px-1 sm:px-1.5 rounded-full border transition-all leading-tight w-full ${shift.isCurry
                                                                ? "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200"
                                                                : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                                                                }`}
                                                        >
                                                            {shift.isCurry ? "🍛 カレー" : "🍜 ラーメン"}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {staffAndManagers.length === 0 && (
                                <tr>
                                    <td colSpan={daysInMonth + 1} className="p-8 text-center text-gray-400">
                                        従業員が登録されていません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 sm:mt-6 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-orange-100">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded-full inline-block"></span> 出勤可能（○）</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded-full inline-block"></span> 出勤不可（×）</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full inline-block"></span> 確定済み</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-50 rounded-full inline-block border"></span> 未回答</div>
                </div>
            </div>

            <UserManagementModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
            />
        </div>
    );
}
