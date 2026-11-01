import * as SQLite from "expo-sqlite";

import type { RawDownloadRow } from "@/features/library/types/download";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  dbPromise ??= (async () => {
    const db = await SQLite.openDatabaseAsync("amphihub-downloads.db");
    await db.execAsync(`
      create table if not exists downloads (
        resource_id text primary key not null,
        file_id text not null,
        local_uri text not null,
        size_bytes integer not null,
        sha256 text,
        summary text not null,
        downloaded_at integer not null
      );
    `);
    return db;
  })();
  return dbPromise;
}

export const downloadsDb = {
  list: async (): Promise<RawDownloadRow[]> => {
    const db = await getDb();
    return db.getAllAsync<RawDownloadRow>(
      "select * from downloads order by downloaded_at desc",
    );
  },

  get: async (resourceId: string): Promise<RawDownloadRow | null> => {
    const db = await getDb();
    return db.getFirstAsync<RawDownloadRow>(
      "select * from downloads where resource_id = ?",
      resourceId,
    );
  },

  put: async (row: RawDownloadRow): Promise<void> => {
    const db = await getDb();
    await db.runAsync(
      `insert or replace into downloads
        (resource_id, file_id, local_uri, size_bytes, sha256, summary, downloaded_at)
       values (?, ?, ?, ?, ?, ?, ?)`,
      row.resource_id,
      row.file_id,
      row.local_uri,
      row.size_bytes,
      row.sha256,
      row.summary,
      row.downloaded_at,
    );
  },

  remove: async (resourceId: string): Promise<void> => {
    const db = await getDb();
    await db.runAsync(
      "delete from downloads where resource_id = ?",
      resourceId,
    );
  },
};
