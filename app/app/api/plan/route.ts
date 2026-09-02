import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureSchema, getD1 } from '@/db';

export async function GET(request: Request) {
  const user = await getChatGPTUser(); if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const date = new URL(request.url).searchParams.get('date'); if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });
  const db = getD1(); await ensureSchema(db);
  const row = await db.prepare('SELECT items_json AS itemsJson, readiness_score AS readinessScore FROM daily_plans WHERE user_id = ? AND plan_date = ?').bind(user.userId, date).first<{itemsJson:string; readinessScore:number}>();
  return NextResponse.json({ plan: row ? { items: JSON.parse(row.itemsJson), readinessScore: row.readinessScore } : null });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser(); if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { date } = await request.json() as { date?: string }; if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });
  const db = getD1(); await ensureSchema(db);
  const tasks = await db.prepare('SELECT id, title, meta FROM tasks WHERE user_id = ? AND completed = 0 ORDER BY position LIMIT 4').bind(user.userId).all<{id:string;title:string;meta:string}>();
  const checkin = await db.prepare('SELECT sleep_minutes AS sleepMinutes, energy, soreness FROM wellbeing_checkins WHERE user_id = ? AND checkin_date = ?').bind(user.userId, date).first<{sleepMinutes:number;energy:number;soreness:number}>();
  const readiness = checkin ? Math.round(Math.min(checkin.sleepMinutes / 480, 1) * 40 + (checkin.energy / 5) * 35 + ((6 - checkin.soreness) / 5) * 25) : 70;
  let hour = 9; const items = (tasks.results ?? []).map((task, index) => { const duration = readiness < 55 ? 45 : index === 0 ? 75 : 45; const item = { id: task.id, time: `${hour}:00`, title: task.title, type: index === 0 ? 'Focus' : 'Priority', duration }; hour += Math.ceil(duration / 60) + (index === 0 ? 1 : 0); return item; });
  if (items.length === 0) items.push({ id: 'recovery', time: '9:00', title: 'Choose one meaningful priority', type: 'Planning', duration: 30 });
  const now = Date.now(); await db.prepare(`INSERT INTO daily_plans (id,user_id,plan_date,items_json,readiness_score,created_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,plan_date) DO UPDATE SET items_json=excluded.items_json,readiness_score=excluded.readiness_score,updated_at=excluded.updated_at`).bind(crypto.randomUUID(), user.userId, date, JSON.stringify(items), readiness, now, now).run();
  return NextResponse.json({ plan: { items, readinessScore: readiness } });
}

