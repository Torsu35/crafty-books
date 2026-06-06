// SQLite in the browser via sql.js, persisted to IndexedDB.
// All access is client-side only.
import localforage from "localforage";
import type { Database, SqlJsStatic } from "sql.js";
import { SCHEMA_SQL, SEED_ACCOUNTS_SQL } from "./schema";

const STORE_KEY = "ais.sqlite.db";
const store = localforage.createInstance({ name: "ais-ledger", storeName: "db" });

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  const initSqlJs = (await import("sql.js")).default;
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/${file}`,
  });
  return SQL!;
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const sql = await loadSqlJs();
    const saved = (await store.getItem<Uint8Array>(STORE_KEY)) || null;
    const db = saved ? new sql.Database(saved) : new sql.Database();
    if (!saved) {
      db.exec(SCHEMA_SQL);
      db.exec(SEED_ACCOUNTS_SQL);
      await persist(db);
    } else {
      // Ensure schema is up to date for existing DBs.
      db.exec(SCHEMA_SQL);
      db.exec(SEED_ACCOUNTS_SQL);
    }
    dbInstance = db;
    return db;
  })();
  return initPromise;
}

export async function persist(db?: Database): Promise<void> {
  const d = db || dbInstance;
  if (!d) return;
  const data = d.export();
  await store.setItem(STORE_KEY, data);
}

export async function exportDbBytes(): Promise<Uint8Array> {
  const db = await getDb();
  return db.export();
}

export async function importDbBytes(bytes: Uint8Array): Promise<void> {
  const sql = await loadSqlJs();
  if (dbInstance) dbInstance.close();
  dbInstance = new sql.Database(bytes);
  await persist(dbInstance);
}

export async function wipeDb(): Promise<void> {
  if (dbInstance) dbInstance.close();
  dbInstance = null;
  initPromise = null;
  await store.removeItem(STORE_KEY);
}

// ---------- helpers ----------
export type Row = Record<string, unknown>;

export async function all<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params as never);
  const out: T[] = [];
  while (stmt.step()) out.push(stmt.getAsObject() as T);
  stmt.free();
  return out;
}

export async function one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

export async function run(
  sql: string,
  params: unknown[] = [],
): Promise<{ lastId: number; changes: number }> {
  const db = await getDb();
  db.run(sql, params as never);
  const lastId = (db.exec("SELECT last_insert_rowid() AS id")[0]?.values[0]?.[0] as number) || 0;
  const changes = (db.exec("SELECT changes() AS c")[0]?.values[0]?.[0] as number) || 0;
  await persist(db);
  return { lastId, changes };
}

export async function tx(fn: (db: Database) => void): Promise<void> {
  const db = await getDb();
  db.exec("BEGIN");
  try {
    fn(db);
    db.exec("COMMIT");
    await persist(db);
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}