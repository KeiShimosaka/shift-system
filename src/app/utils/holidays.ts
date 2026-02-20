/**
 * 日本の祝日判定ユーティリティ
 * 指定された年・月・日が祝日かどうかを判定する
 */

// 第N月曜日を計算
function getNthMonday(year: number, month: number, n: number): number {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const firstMonday = firstDay === 0 ? 2 : firstDay <= 1 ? 2 - firstDay : 9 - firstDay;
    return firstMonday + (n - 1) * 7;
}

// 春分の日（3月）
function getVernalEquinoxDay(year: number): number {
    if (year >= 2000 && year <= 2099) {
        return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    }
    return 20; // fallback
}

// 秋分の日（9月）
function getAutumnalEquinoxDay(year: number): number {
    if (year >= 2000 && year <= 2099) {
        return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
    }
    return 23; // fallback
}

/** 指定年の全祝日リストを返す (Map<"M-D", 祝日名>) */
export function getHolidaysForYear(year: number): Map<string, string> {
    const holidays = new Map<string, string>();

    // 固定祝日
    holidays.set(`1-1`, "元日");
    holidays.set(`2-11`, "建国記念の日");
    holidays.set(`2-23`, "天皇誕生日");
    holidays.set(`4-29`, "昭和の日");
    holidays.set(`5-3`, "憲法記念日");
    holidays.set(`5-4`, "みどりの日");
    holidays.set(`5-5`, "こどもの日");
    holidays.set(`8-11`, "山の日");
    holidays.set(`11-3`, "文化の日");
    holidays.set(`11-23`, "勤労感謝の日");

    // ハッピーマンデー（第N月曜日）
    holidays.set(`1-${getNthMonday(year, 1, 2)}`, "成人の日");
    holidays.set(`7-${getNthMonday(year, 7, 3)}`, "海の日");
    holidays.set(`9-${getNthMonday(year, 9, 3)}`, "敬老の日");
    holidays.set(`10-${getNthMonday(year, 10, 2)}`, "スポーツの日");

    // 春分・秋分
    const vernalDay = getVernalEquinoxDay(year);
    holidays.set(`3-${vernalDay}`, "春分の日");
    const autumnalDay = getAutumnalEquinoxDay(year);
    holidays.set(`9-${autumnalDay}`, "秋分の日");

    // 振替休日: 祝日が日曜なら翌月曜が振替休日
    const allKeys = Array.from(holidays.keys());
    for (const key of allKeys) {
        const [m, d] = key.split("-").map(Number);
        const date = new Date(year, m - 1, d);
        if (date.getDay() === 0) {
            // 翌日（月曜）が既に祝日なら、さらに翌日へ
            let substituteDay = d + 1;
            while (holidays.has(`${m}-${substituteDay}`)) {
                substituteDay++;
            }
            holidays.set(`${m}-${substituteDay}`, "振替休日");
        }
    }

    // 国民の休日: 祝日と祝日に挟まれた平日
    // 典型的なケースは9月（敬老の日と秋分の日の間）
    const septList = Array.from(holidays.entries())
        .filter(([k]) => k.startsWith("9-"))
        .map(([k]) => parseInt(k.split("-")[1]))
        .sort((a, b) => a - b);
    if (septList.length >= 2) {
        for (let i = 0; i < septList.length - 1; i++) {
            if (septList[i + 1] - septList[i] === 2) {
                const betweenDay = septList[i] + 1;
                const betweenDate = new Date(year, 8, betweenDay);
                if (betweenDate.getDay() !== 0 && !holidays.has(`9-${betweenDay}`)) {
                    holidays.set(`9-${betweenDay}`, "国民の休日");
                }
            }
        }
    }

    return holidays;
}

/** 指定日が祝日かどうか */
export function isHoliday(year: number, month: number, day: number): boolean {
    const holidays = getHolidaysForYear(year);
    return holidays.has(`${month}-${day}`);
}

/** 指定日の祝日名を返す（祝日でなければnull） */
export function getHolidayName(year: number, month: number, day: number): string | null {
    const holidays = getHolidaysForYear(year);
    return holidays.get(`${month}-${day}`) ?? null;
}

/** 指定日が休日（土日または祝日）かどうか */
export function isNonWorkday(year: number, month: number, day: number): boolean {
    const dow = new Date(year, month - 1, day).getDay();
    return dow === 0 || dow === 6 || isHoliday(year, month, day);
}
