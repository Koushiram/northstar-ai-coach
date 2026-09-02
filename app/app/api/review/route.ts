import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureSchema, getD1 } from '@/db';

export async function PUT(request: Request) {
  const user = await getChatGPTUser(); if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const body = await request.json() as { date?:string; win?:string; reflection?:string; energy?:number };
  if (!body.date || !body.win?.trim() || !body.reflection?.trim() || !Number.isInteger(body.energy) || Number(body.energy) < 1 || Number(body.energy) > 5) return NextResponse.json({ error: 'Complete all review fields.' }, { status: 400 });
  const db=getD1(); await ensureSchema(db); const now=Date.now();
  await db.prepare(`INSERT INTO daily_reviews (id,user_id,review_date,win,reflection,evening_energy,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id,review_date) DO UPDATE SET win=excluded.win,reflection=excluded.reflection,evening_energy=excluded.evening_energy,updated_at=excluded.updated_at`).bind(crypto.randomUUID(),user.userId,body.date,body.win.trim(),body.reflection.trim(),body.energy,now,now).run();
  return NextResponse.json({ saved:true });
}
