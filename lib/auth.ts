import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'ramen-daikichi-secret-key-2026'
);

const COOKIE_NAME = 'ramen-session';

export interface SessionPayload {
    userId: number;
    name: string;
    role: string;
}

// JWT生成してCookieにセット
export async function createSession(payload: SessionPayload) {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(SECRET);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24時間
        path: '/',
    });
}

// CookieからJWT検証してセッション情報を返す
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, SECRET);
        return {
            userId: payload.userId as number,
            name: payload.name as string,
            role: payload.role as string,
        };
    } catch {
        return null;
    }
}

// Cookie削除（ログアウト）
export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
