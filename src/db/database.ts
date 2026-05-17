// ============================================================
// RemindMeHere — SQLite Database Layer
// ============================================================
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { DATABASE_NAME } from '../constants/config';
import {
  Reminder,
  CreateReminderInput,
  TriggerHistoryEntry,
  SavedLocation,
  TriggerAction,
} from '../types';
import { nowISO } from '../utils/formatters';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize the database connection.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeSchema(db);
  return db;
}

/**
 * Create tables if they don't exist.
 */
async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS reminders (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      description     TEXT,
      latitude        REAL NOT NULL,
      longitude       REAL NOT NULL,
      location_name   TEXT,
      location_address TEXT,
      radius_meters   INTEGER DEFAULT 150,
      trigger_on      TEXT DEFAULT 'enter',
      is_recurring    INTEGER DEFAULT 0,
      is_active       INTEGER DEFAULT 1,
      category        TEXT DEFAULT 'general',
      priority        TEXT DEFAULT 'normal',
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL,
      completed_at    TEXT,
      snoozed_until   TEXT,
      trigger_count   INTEGER DEFAULT 0,
      last_triggered  TEXT
    );

    CREATE TABLE IF NOT EXISTS trigger_history (
      id              TEXT PRIMARY KEY,
      reminder_id     TEXT NOT NULL,
      triggered_at    TEXT NOT NULL,
      action_taken    TEXT,
      latitude        REAL,
      longitude       REAL,
      FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_locations (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      latitude        REAL NOT NULL,
      longitude       REAL NOT NULL,
      address         TEXT,
      icon            TEXT DEFAULT 'pin',
      created_at      TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active);
    CREATE INDEX IF NOT EXISTS idx_reminders_category ON reminders(category);
    CREATE INDEX IF NOT EXISTS idx_trigger_history_reminder ON trigger_history(reminder_id);
  `);
}

/**
 * Generate a UUID for new records.
 */
async function generateId(): Promise<string> {
  return Crypto.randomUUID();
}

// ─── Reminder CRUD ──────────────────────────────────────────

function rowToReminder(row: any): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    locationName: row.location_name,
    locationAddress: row.location_address,
    radiusMeters: row.radius_meters,
    triggerOn: row.trigger_on,
    isRecurring: !!row.is_recurring,
    isActive: !!row.is_active,
    category: row.category,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    snoozedUntil: row.snoozed_until,
    triggerCount: row.trigger_count,
    lastTriggered: row.last_triggered,
  };
}

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const database = await getDatabase();
  const id = await generateId();
  const now = nowISO();

  await database.runAsync(
    `INSERT INTO reminders (
      id, title, description, latitude, longitude, location_name, location_address,
      radius_meters, trigger_on, is_recurring, is_active, category, priority,
      created_at, updated_at, trigger_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0)`,
    [
      id,
      input.title.trim(),
      input.description || null,
      input.latitude,
      input.longitude,
      input.locationName || null,
      input.locationAddress || null,
      input.radiusMeters ?? 150,
      input.triggerOn ?? 'enter',
      input.isRecurring ? 1 : 0,
      input.category ?? 'general',
      input.priority ?? 'normal',
      now,
      now,
    ]
  );

  return (await getReminderById(id))!;
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync('SELECT * FROM reminders WHERE id = ?', [id]);
  return row ? rowToReminder(row) : null;
}

export async function getAllReminders(): Promise<Reminder[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync('SELECT * FROM reminders ORDER BY created_at DESC');
  return rows.map(rowToReminder);
}

export async function getActiveReminders(): Promise<Reminder[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    `SELECT * FROM reminders
     WHERE is_active = 1 AND completed_at IS NULL
     AND (snoozed_until IS NULL OR snoozed_until <= ?)
     ORDER BY created_at DESC`,
    [nowISO()]
  );
  return rows.map(rowToReminder);
}

export async function updateReminder(id: string, updates: Partial<CreateReminderInput>): Promise<void> {
  const database = await getDatabase();
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) { setClauses.push('title = ?'); values.push(updates.title.trim()); }
  if (updates.description !== undefined) { setClauses.push('description = ?'); values.push(updates.description); }
  if (updates.latitude !== undefined) { setClauses.push('latitude = ?'); values.push(updates.latitude); }
  if (updates.longitude !== undefined) { setClauses.push('longitude = ?'); values.push(updates.longitude); }
  if (updates.locationName !== undefined) { setClauses.push('location_name = ?'); values.push(updates.locationName); }
  if (updates.locationAddress !== undefined) { setClauses.push('location_address = ?'); values.push(updates.locationAddress); }
  if (updates.radiusMeters !== undefined) { setClauses.push('radius_meters = ?'); values.push(updates.radiusMeters); }
  if (updates.triggerOn !== undefined) { setClauses.push('trigger_on = ?'); values.push(updates.triggerOn); }
  if (updates.isRecurring !== undefined) { setClauses.push('is_recurring = ?'); values.push(updates.isRecurring ? 1 : 0); }
  if (updates.category !== undefined) { setClauses.push('category = ?'); values.push(updates.category); }
  if (updates.priority !== undefined) { setClauses.push('priority = ?'); values.push(updates.priority); }

  if (setClauses.length === 0) return;

  setClauses.push('updated_at = ?');
  values.push(nowISO());
  values.push(id);

  await database.runAsync(
    `UPDATE reminders SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
}

export async function completeReminder(id: string): Promise<void> {
  const database = await getDatabase();
  const now = nowISO();
  await database.runAsync(
    'UPDATE reminders SET completed_at = ?, is_active = 0, updated_at = ? WHERE id = ?',
    [now, now, id]
  );
}

export async function snoozeReminder(id: string, untilISO: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE reminders SET snoozed_until = ?, updated_at = ? WHERE id = ?',
    [untilISO, nowISO(), id]
  );
}

export async function toggleReminderActive(id: string, isActive: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE reminders SET is_active = ?, updated_at = ? WHERE id = ?',
    [isActive ? 1 : 0, nowISO(), id]
  );
}

export async function deleteReminder(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
}

export async function recordTrigger(reminderId: string, lat?: number, lng?: number): Promise<void> {
  const database = await getDatabase();
  const id = await generateId();
  const now = nowISO();

  await database.runAsync(
    'INSERT INTO trigger_history (id, reminder_id, triggered_at, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
    [id, reminderId, now, lat ?? null, lng ?? null]
  );

  await database.runAsync(
    'UPDATE reminders SET trigger_count = trigger_count + 1, last_triggered = ?, updated_at = ? WHERE id = ?',
    [now, now, reminderId]
  );
}

export async function updateTriggerAction(triggerId: string, action: TriggerAction): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE trigger_history SET action_taken = ? WHERE id = ?',
    [action, triggerId]
  );
}

export async function getTriggerHistory(reminderId: string): Promise<TriggerHistoryEntry[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    'SELECT * FROM trigger_history WHERE reminder_id = ? ORDER BY triggered_at DESC',
    [reminderId]
  );
  return rows.map((r: any) => ({
    id: r.id,
    reminderId: r.reminder_id,
    triggeredAt: r.triggered_at,
    actionTaken: r.action_taken,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

// ─── Saved Locations CRUD ───────────────────────────────────

export async function createSavedLocation(
  name: string, latitude: number, longitude: number, address?: string, icon?: string
): Promise<SavedLocation> {
  const database = await getDatabase();
  const id = await generateId();
  const now = nowISO();

  await database.runAsync(
    'INSERT INTO saved_locations (id, name, latitude, longitude, address, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, latitude, longitude, address ?? null, icon ?? 'pin', now]
  );

  return { id, name, latitude, longitude, address: address ?? null, icon: icon ?? 'pin', createdAt: now };
}

export async function getAllSavedLocations(): Promise<SavedLocation[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync('SELECT * FROM saved_locations ORDER BY created_at DESC');
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address,
    icon: r.icon,
    createdAt: r.created_at,
  }));
}

export async function deleteSavedLocation(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM saved_locations WHERE id = ?', [id]);
}

// ─── Export / Import ────────────────────────────────────────

export async function exportAllData(): Promise<string> {
  const reminders = await getAllReminders();
  const locations = await getAllSavedLocations();
  return JSON.stringify({ version: 1, exportedAt: nowISO(), reminders, savedLocations: locations }, null, 2);
}

export async function importData(jsonString: string): Promise<{ reminders: number; locations: number }> {
  const data = JSON.parse(jsonString);
  const database = await getDatabase();
  let remCount = 0;
  let locCount = 0;

  if (data.reminders) {
    for (const r of data.reminders) {
      const existing = await getReminderById(r.id);
      if (!existing) {
        await database.runAsync(
          `INSERT INTO reminders (id, title, description, latitude, longitude, location_name, location_address,
            radius_meters, trigger_on, is_recurring, is_active, category, priority,
            created_at, updated_at, completed_at, snoozed_until, trigger_count, last_triggered)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.title, r.description, r.latitude, r.longitude, r.locationName, r.locationAddress,
           r.radiusMeters, r.triggerOn, r.isRecurring ? 1 : 0, r.isActive ? 1 : 0, r.category, r.priority,
           r.createdAt, r.updatedAt, r.completedAt, r.snoozedUntil, r.triggerCount, r.lastTriggered]
        );
        remCount++;
      }
    }
  }

  if (data.savedLocations) {
    for (const l of data.savedLocations) {
      await database.runAsync(
        'INSERT OR IGNORE INTO saved_locations (id, name, latitude, longitude, address, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [l.id, l.name, l.latitude, l.longitude, l.address, l.icon, l.createdAt]
      );
      locCount++;
    }
  }

  return { reminders: remCount, locations: locCount };
}

// ─── Cleanup ────────────────────────────────────────────────

export async function cleanupOldHistory(retentionDays: number = 30): Promise<void> {
  const database = await getDatabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  await database.runAsync(
    'DELETE FROM trigger_history WHERE triggered_at < ?',
    [cutoff.toISOString()]
  );
}
