import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureSchema, getD1 } from '@/db';

const demoTasks = [['Finish Northstar product brief', 'Deep work · 75 min'], ['Review monthly spending', 'Finance · 25 min'], ['Evening strength session', 'Health · 45 min']];

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const db = getD1(); await ensureSchema(db);
  const result = await db.prepare('SELECT id, title, meta, completed, position FROM tasks WHERE user_id = ? ORDER BY position, created_at').bind(user.userId).all();
  return NextResponse.json({ tasks: result.results, user });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const body = await request.json() as { title?: string; meta?: string; seed?: boolean };
  const db = getD1(); await ensureSchema(db); const now = Date.now();
  if (body.seed) {
    const count = await db.prepare('SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?').bind(user.userId).first<{ count: number }>();
    if ((count?.count ?? 0) === 0) await db.batch(demoTasks.map(([title, meta], position) => db.prepare('INSERT INTO tasks (id, user_id, title, meta, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)').bind(crypto.randomUUID(), user.userId, title, meta, position, now, now)));
    return NextResponse.json({ seeded: true });
  }
  const title = body.title?.trim();
  if (!title || title.length > 140) return NextResponse.json({ error: 'A task title between 1 and 140 characters is required.' }, { status: 400 });
  const position = await db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM tasks WHERE user_id = ?').bind(user.userId).first<{ next_position: number }>();
  const task = { id: crypto.randomUUID(), title, meta: body.meta?.trim() || 'Personal · 30 min', completed: 0, position: position?.next_position ?? 0 };
  await db.prepare('INSERT INTO tasks (id, user_id, title, meta, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)').bind(task.id, user.userId, task.title, task.meta, task.position, now, now).run();
  return NextResponse.json({ task }, { status: 201 });
}
