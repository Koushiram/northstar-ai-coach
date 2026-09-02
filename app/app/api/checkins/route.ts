import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getD1 } from '@/db';

type CheckinInput = {
  checkinDate?: string;
  sleepMinutes?: number;
  energy?: number;
  mood?: number;
  soreness?: number;
};

function validScore(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const date = new URL(request.url).searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'A valid date is required.' }, { status: 400 });
  const checkin = await getD1().prepare(
    'SELECT checkin_date AS checkinDate, sleep_minutes AS sleepMinutes, energy, mood, soreness FROM wellbeing_checkins WHERE user_id = ? AND checkin_date = ?',
  ).bind(user.userId, date).first();
  return NextResponse.json({ checkin });
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const body = await request.json() as CheckinInput;
  if (!body.checkinDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkinDate) || !Number.isInteger(body.sleepMinutes) || Number(body.sleepMinutes) < 0 || Number(body.sleepMinutes) > 1440 || !validScore(body.energy) || !validScore(body.mood) || !validScore(body.soreness)) {
    return NextResponse.json({ error: 'Valid sleep, energy, mood, and soreness values are required.' }, { status: 400 });
  }
  const now = Date.now();
  const id = crypto.randomUUID();
  await getD1().prepare(`
    INSERT INTO wellbeing_checkins (id, user_id, checkin_date, sleep_minutes, energy, mood, soreness, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, checkin_date) DO UPDATE SET
      sleep_minutes = excluded.sleep_minutes,
      energy = excluded.energy,
      mood = excluded.mood,
      soreness = excluded.soreness,
      updated_at = excluded.updated_at
  `).bind(id, user.userId, body.checkinDate, body.sleepMinutes, body.energy, body.mood, body.soreness, now, now).run();
  return NextResponse.json({ checkin: body });
}

