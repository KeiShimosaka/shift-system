"use client";

import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { login, getUserNames } from '../actions/authActions';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [userNames, setUserNames] = useState<string[]>([]);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        getUserNames().then(setUserNames).catch(console.error);
    }, []);

    const handleLogin = async () => {
        if (!name) {
            setError("従業員を選択してください");
            return;
        }
        if (!password) {
            setError("パスワードを入力してください");
            return;
        }

        setLoading(true);
        setError("");

        const result = await login(name, password);

        if (result.error) {
            setError(result.error);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            setLoading(false);
            return;
        }

        // フルリロードでStaffProviderを再マウントし、セッション情報を読み込む
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-sm border-t-4 border-orange-600 ${isShaking ? "animate-shake" : ""}`}>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Lock size={28} className="text-orange-600" />
                    </div>
                    <h1 className="text-xl font-bold text-orange-600">ラーメン大吉・オムランカ</h1>
                    <p className="text-gray-400 text-xs mt-1">シフト管理システム</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1.5">従業員名</label>
                        <select
                            value={name}
                            onChange={e => { setName(e.target.value); setError(""); }}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white appearance-none"
                        >
                            <option value="">-- 選択してください --</option>
                            {userNames.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1.5">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(""); }}
                            onKeyDown={e => e.key === "Enter" && handleLogin()}
                            placeholder="パスワードを入力..."
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm py-2 px-3 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-orange-600 text-white py-3 rounded-full font-bold hover:bg-orange-700 active:bg-orange-800 transition-all shadow-md text-base disabled:opacity-50"
                    >
                        {loading ? "ログイン中..." : "ログイン"}
                    </button>
                </div>
            </div>
        </div>
    );
}
