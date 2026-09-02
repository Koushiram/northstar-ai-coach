import { NextResponse } from 'next/server';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureSchema, getD1 } from '@/db';

type Task = { title: string; meta: string; completed: number };
type Checkin = { sleepMinutes: number | null; energy: number | null; mood: number | null; soreness: number | null };

function readiness(checkin: Checkin | null) {
  if (!checkin || checkin.sleepMinutes == null || checkin.energy == null || checkin.soreness == null) return 70;
  return Math.round(Math.min(checkin.sleepMinutes / 480, 1) * 40 + (checkin.energy / 5) * 35 + ((6 - checkin.soreness) / 5) * 25);
}

function coachReply(message: string, tasks: Task[], checkin: Checkin | null) {
  const open = tasks.filter((task) => !task.completed);
  const next = open[0];
  const score = readiness(checkin);
  const lower = message.toLowerCase();
  const lowRecovery = score < 55;

  if (/what.*(next|now)|priority|focus/.test(lower)) {
    if (!next) return `You have cleared today's priorities. Use the next 20 minutes to reset, then choose one meaningful task for tomorrow.`;
    return lowRecovery
      ? `Your readiness is ${score}, so keep the load light. Start “${next.title}” for 25 focused minutes, then take a 10-minute recovery break.`
      : `Your next best move is “${next.title}”. Protect ${next.meta.includes('75') ? '75' : '45'} minutes, silence distractions, and stop when the block ends.`;
  }
  if (/replan|afternoon|schedule|plan/.test(lower)) {
    const titles = open.slice(0, 3).map((task) => `“${task.title}”`).join(', ');
    return lowRecovery
      ? `Make today a recovery-aware day: one 45-minute focus block for ${titles || 'your main priority'}, a real lunch break, and no more than two secondary tasks.`
      : `Keep ${titles || 'one meaningful priority'} in order. Use a 75-minute focus block first, a 15-minute buffer, then one 45-minute follow-up block.`;
  }
  if (/tired|energy|sleep|recovery|sore|workout/.test(lower)) {
    if (!checkin) return `Complete your morning check-in first. I need sleep, energy, and soreness to recommend the right workload.`;
    return `Your readiness is ${score}/100. ${lowRecovery ? 'Reduce intensity, protect sleep tonight, and choose walking or mobility over a hard workout.' : 'You can handle a normal day, but keep one recovery break between demanding blocks.'}`;
  }
  if (/done|complete|progress/.test(lower)) {
    const done = tasks.length - open.length;
    return `You have completed ${done} of ${tasks.length} priorities. ${next ? `Finish “${next.title}” before adding anything new.` : 'That is enough for today—close the loop with your evening review.'}`;
  }
  return `I’m using today’s priorities and readiness to coach you. Ask “What should I do next?”, “Replan my afternoon”, or “Should I reduce my workout?”`;
}

async function generateModelReply(message: string, tasks: Task[], checkin: Checkin | null, fallback: string) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return { reply: fallback, mode: 'guided' as const };
  const openTasks = tasks.filter((task) => !task.completed).slice(0, 8);
  const context = {
    readinessScore: readiness(checkin),
    wellbeing: checkin,
    priorities: openTasks.map(({ title, meta }) => ({ title, meta })),
    completedToday: tasks.length - openTasks.length,
  };
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-5.4-mini',
        store: false,
        max_output_tokens: 240,
        instructions: 'You are Northstar, a calm personal coach. Use only the supplied daily context. Give one clear recommendation, a short reason, and one concrete next action. Never invent calendar, financial, health, or task data. Do not diagnose or provide medical treatment. Be concise and supportive.',
        input: `Daily context:\n${JSON.stringify(context)}\n\nUser: ${message}`,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return { reply: fallback, mode: 'guided' as const };
    const result = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const reply = result.output_text?.trim() || result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text?.trim();
    return reply ? { reply, mode: 'ai' as const } : { reply: fallback, mode: 'guided' as const };
  } catch {
    return { reply: fallback, mode: 'guided' as const };
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const body = await request.json() as { message?: string; date?: string };
  const message = body.message?.trim();
  const date = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : new Date().toISOString().slice(0, 10);
  if (!message || message.length > 500) return NextResponse.json({ error: 'Enter a message up to 500 characters.' }, { status: 400 });

  const db = getD1();
  await ensureSchema(db);
  const [taskResult, checkin] = await Promise.all([
    db.prepare('SELECT title, meta, completed FROM tasks WHERE user_id = ? ORDER BY position, created_at').bind(user.userId).all<Task>(),
    db.prepare('SELECT sleep_minutes AS sleepMinutes, energy, mood, soreness FROM wellbeing_checkins WHERE user_id = ? AND checkin_date = ?').bind(user.userId, date).first<Checkin>(),
  ]);
  const tasks = taskResult.results ?? [];
  const result = await generateModelReply(message, tasks, checkin ?? null, coachReply(message, tasks, checkin ?? null));
  return NextResponse.json(result);
}
