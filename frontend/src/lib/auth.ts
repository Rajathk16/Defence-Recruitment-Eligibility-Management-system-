// Server-side authentication and session management using Web Crypto API.
// Compatible with both Node.js server runtime and Next.js Edge Middleware.

export type UserRole = 'officer' | 'candidate';

export interface SessionUser {
  role: UserRole;
  candidateId?: number;
  email?: string;
  fullName?: string;
  iat: number;
  exp: number;
}

const COOKIE_NAME = 'drems_session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// BUG-11 FIX: removed hardcoded DEFAULT_SECRET; SESSION_SECRET env var is now mandatory.
// The application will throw a clear error at startup if SESSION_SECRET is not set.
function getSecretKey(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET environment variable is required but not set. ' +
      'Please add SESSION_SECRET to your .env.local file.'
    );
  }
  return secret;
}

// Base64URL helpers
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecretKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(
  user: Omit<SessionUser, 'iat' | 'exp'>
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionUser = {
    ...user,
    iat: now,
    exp: now + SESSION_DURATION,
  };

  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(dataToSign)
  );
  const encodedSig = base64UrlEncode(signature);

  return `${dataToSign}.${encodedSig}`;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey();
    const enc = new TextEncoder();
    const sigBytes = base64UrlDecode(encodedSig);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(dataToVerify)
    );

    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(encodedPayload));
    const payload: SessionUser = JSON.parse(payloadJson);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${COOKIE_NAME}=`)) {
      return decodeURIComponent(cookie.substring(COOKIE_NAME.length + 1));
    }
  }
  return null;
}

export function getCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_DURATION}; HttpOnly; SameSite=Lax${
    isProd ? '; Secure' : ''
  }`;
}

export function getClearCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export { COOKIE_NAME };
