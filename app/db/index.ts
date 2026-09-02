import { env } from 'cloudflare:workers';
export function getD1(): D1Database { if (!env.DB) throw new Error('Northstar database binding is unavailable.'); return env.DB; }

export async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      meta TEXT DEFAULT 'Personal · 30 min' NOT NULL,
      completed INTEGER DEFAULT 0 NOT NULL,
      position INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_user_id_id ON tasks (user_id, id)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS wellbeing_checkins (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      checkin_date TEXT NOT NULL,
      sleep_minutes INTEGER,
      energy INTEGER,
      mood INTEGER,
      soreness INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_user_date ON wellbeing_checkins (user_id, checkin_date)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS daily_plans (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, plan_date TEXT NOT NULL,
      items_json TEXT NOT NULL, readiness_score INTEGER NOT NULL,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    )`),
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans (user_id, plan_date)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS daily_reviews (
      id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, review_date TEXT NOT NULL,
      win TEXT NOT NULL, reflection TEXT NOT NULL, evening_energy INTEGER NOT NULL,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    )`),
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_reviews_user_date ON daily_reviews (user_id, review_date)'),
  ]);
}
