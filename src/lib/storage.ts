import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredSession, SCHEMA_VERSION, STORAGE_KEY, DAILY_LOG_KEY, DailyLog } from '../types/index';

/**
 * Pure function — serializes a StoredSession to a JSON string.
 * No side effects, no I/O.
 */
export function serializeSession(session: StoredSession): string {
  return JSON.stringify(session);
}

/**
 * Pure function — parses a JSON string into a StoredSession.
 * Throws SyntaxError on invalid JSON (from JSON.parse).
 * Throws Error when schema_version is missing or !== SCHEMA_VERSION.
 * No side effects, no I/O.
 */
export function deserializeSession(raw: string): StoredSession {
  const parsed = JSON.parse(raw); // throws SyntaxError on invalid JSON

  if (!parsed.schema_version || parsed.schema_version !== SCHEMA_VERSION) {
    throw new Error(
      `Invalid schema_version: expected "${SCHEMA_VERSION}", got "${parsed.schema_version}"`
    );
  }

  return parsed as StoredSession;
}

/**
 * Async wrapper — serializes and persists a StoredSession to AsyncStorage.
 * Silently swallows all errors (no crash, no rethrow).
 */
export async function saveSession(session: StoredSession): Promise<void> {
  try {
    const serialized = serializeSession(session);
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // silently swallow — no crash
  }
}

/**
 * Async wrapper — reads and deserializes a StoredSession from AsyncStorage.
 * Returns null if no entry exists, schema_version mismatches, or any error occurs.
 */
export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    try {
      return deserializeSession(raw);
    } catch {
      // schema_version mismatch or invalid JSON — delete stale entry
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Async wrapper — removes the session key from AsyncStorage.
 */
export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ── Daily Log Storage ─────────────────────────────────────────────────────────

export async function loadDailyLogs(): Promise<DailyLog[]> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DailyLog[];
  } catch {
    return [];
  }
}

export async function saveDailyLog(log: DailyLog): Promise<void> {
  try {
    const existing = await loadDailyLogs();
    const idx = existing.findIndex((l) => l.date === log.date);
    if (idx >= 0) {
      existing[idx] = log;
    } else {
      existing.push(log);
    }
    await AsyncStorage.setItem(DAILY_LOG_KEY, JSON.stringify(existing));
  } catch {
    // silently swallow
  }
}

export async function getTodayLog(): Promise<DailyLog | null> {
  const today = new Date().toISOString().split('T')[0];
  const logs = await loadDailyLogs();
  return logs.find((l) => l.date === today) ?? null;
}
