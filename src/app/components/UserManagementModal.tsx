import React, { useState } from 'react';
import { useStaff, StaffInfo } from '../context/StaffContext';
import { X, UserPlus, Edit, Save, Trash2 } from 'lucide-react';

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
    const { staffList, registerStaff, updateStaff, deleteStaff } = useStaff();
    const [editingUser, setEditingUser] = useState<StaffInfo | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("STAFF");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const resetForm = () => {
        setName("");
        setPassword("");
        setRole("STAFF");
        setError("");
        setEditingUser(null);
        setIsAdding(false);
    };

    const handleStartEdit = (user: StaffInfo) => {
        setEditingUser(user);
        setName(user.name);
        setPassword(""); // Password not shown for security
        setRole(user.role);
        setIsAdding(false);
        setError("");
    };

    const handleStartAdd = () => {
        setIsAdding(true);
        setEditingUser(null);
        setName("");
        setPassword("");
        setRole("STAFF");
        setError("");
    };

    const handleSave = async () => {
        if (!name) {
            setError("名前を入力してください");
            return;
        }

        setLoading(true);
        let success = false;

        if (isAdding) {
            if (!password) {
                setError("パスワードを入力してください");
                setLoading(false);
                return;
            }
            success = await registerStaff(name, password, role);
        } else if (editingUser) {
            success = await updateStaff(editingUser.id, name, password);
        }

        setLoading(false);

        if (success) {
            resetForm();
        } else {
            setError("保存に失敗しました。名前が重複している可能性があります。");
        }
    };

    const handleDelete = async (user: StaffInfo) => {
        if (!confirm(`${user.name} を削除してもよろしいですか？\n※このユーザーのシフトデータも全て削除されます。`)) return;

        setLoading(true);
        const success = await deleteStaff(user.id);
        setLoading(false);

        if (!success) {
            alert("削除に失敗しました");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-orange-50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-orange-800">ユーザー管理</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {/* User List */}
                    {!isAdding && !editingUser && (
                        <div className="space-y-2">
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={handleStartAdd}
                                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-bold"
                                >
                                    <UserPlus size={16} />
                                    新規スタッフ追加
                                </button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="p-3 font-bold">名前</th>
                                            <th className="p-3 font-bold">権限</th>
                                            <th className="p-3 font-bold text-right">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {staffList.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium text-gray-800">{user.name}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStartEdit(user)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="編集"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Edit/Add Form */}
                    {(isAdding || editingUser) && (
                        <div className="space-y-4">
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
                                    {isAdding ? "新規ユーザー登録" : "ユーザー情報編集"}
                                </h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">名前</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full border rounded p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="名前を入力"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            パスワード
                                            {!isAdding && <span className="text-xs font-normal text-gray-500 ml-2">※変更する場合のみ入力</span>}
                                        </label>
                                        <input
                                            type="text"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full border rounded p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder={isAdding ? "パスワードを入力" : "新しいパスワード（任意）"}
                                        />
                                    </div>

                                    {isAdding && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">権限</label>
                                            <select
                                                value={role}
                                                onChange={e => setRole(e.target.value)}
                                                className="w-full border rounded p-2 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                                            >
                                                <option value="STAFF">STAFF</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </div>
                                    )}

                                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={resetForm}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold"
                                        disabled={loading}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-bold flex items-center gap-2"
                                    >
                                        {loading ? "保存中..." : <><Save size={16} /> 保存</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
