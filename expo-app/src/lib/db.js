// SQLite access via expo-sqlite (synchronous API, SDK 51+).
// The database lives on disk inside the app sandbox — fully offline.
import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL, SEED_ACCOUNTS_SQL } from "./schema";

export const DB_NAME = "ledger.db";
let _db = null;

export function getDb() {
  if (_db) return _db;
  _db = SQLite.openDatabaseSync(DB_NAME);
  _db.execSync("PRAGMA foreign_keys = ON;");
  _db.execSync(SCHEMA_SQL);
  _db.execSync(SEED_ACCOUNTS_SQL);
  return _db;
}

export function closeDb() {
  if (_db) {
    try { _db.closeSync(); } catch {}
    _db = null;
  }
}

/** Run a SELECT, return all rows. */
export function all(sql, params = []) {
  return getDb().getAllSync(sql, params);
}

/** Run a SELECT, return first row or null. */
export function one(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

/** Run an INSERT/UPDATE/DELETE. Returns { lastId, changes }. */
export function run(sql, params = []) {
  const res = getDb().runSync(sql, params);
  return { lastId: res.lastInsertRowId, changes: res.changes };
}

/** Transactional batch. */
export function tx(fn) {
  const db = getDb();
  db.withTransactionSync(() => fn(db));
}

/** Wipe — close + delete the file, then re-open empty. */
export async function wipeDb() {
  closeDb();
  await SQLite.deleteDatabaseAsync(DB_NAME);
  getDb();
}