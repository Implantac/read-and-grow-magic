import type { ChatMessage } from './types';

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout
const SESSION_KEY_PREFIX = 'executive_chat_session:';
export const sessionKeyFor = (uid: string | null) => `${SESSION_KEY_PREFIX}${uid ?? 'anon'}`;

interface SessionData {
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
  lastActivity: string;
}

export function purgeOtherSessionKeys(currentUid: string | null) {
  try {
    const keep = sessionKeyFor(currentUid);
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(SESSION_KEY_PREFIX) && k !== keep) {
        sessionStorage.removeItem(k);
      }
    }
  } catch { /* ignore */ }
}

export function loadSession(uid: string | null): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(sessionKeyFor(uid));
    if (!raw) return [];
    const session: SessionData = JSON.parse(raw);
    const lastActivity = new Date(session.lastActivity).getTime();
    if (Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
      sessionStorage.removeItem(sessionKeyFor(uid));
      return [];
    }
    return session.messages.map(m => ({
      id: crypto.randomUUID(),
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

export function saveSession(uid: string | null, messages: ChatMessage[]) {
  try {
    const session: SessionData = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      })),
      lastActivity: new Date().toISOString(),
    };
    sessionStorage.setItem(sessionKeyFor(uid), JSON.stringify(session));
  } catch { /* ignore storage errors */ }
}
