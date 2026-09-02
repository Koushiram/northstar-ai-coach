import { NextResponse } from 'next/server';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureSchema, getD1 } from '@/db';

type Task = { id: string; title: string; meta: string; completed: number; position: number };
type Checkin = { sleepMinutes: number | null; energy: number | null; mood: number | null; soreness: number | null };

function taskTitleFromMessage(message: string) {
  const patterns = [
    /^(?:please\s+)?(?:add|create|remember)\s+(?:a\s+)?(?:task|priority)(?:\s+(?:to|for))?\s*[:\-]?\s*(.+)$/i,
    /^(?:please\s+)?add\s+(.+?)\s+to\s+my\s+(?:tasks|priorities)$/i,
  ];
  for (const pattern of patterns) {
    const title = message.match(pattern)?.[1]?.trim().replace(/[.!]+$/, '').trim();
    if (title) return title;
  }
  return null;
}

function completedTaskTitleFromMessage(message: string) {
  const patterns = [
    /^(?:please\s+)?mark\s+(?:task\s+)?[:\-]?\s*(.+?)\s+as\s+(?:done|complete|completed)[.!]?$/i,
    /^(?:please\s+)?mark\s+as\s+(?:done|complete|completed)\s+(?:task\s+)?[:\-]?\s*(.+?)[.!]?$/i,
    /^(?:please\s+)?(?:complete|finish)\s+(?:task\s+)?[:\-]?\s*(.+?)[.!]?$/i,
  ];
  for (const pattern of patterns) {
    const title = message.match(pattern)?.[1]?.trim().replace(/^['“”]|['“”]$/g, '').trim();
    if (title) return title;
  }
  return null;
}

function taskTarget(message: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const value = message.match(pattern)?.[1]?.trim().replace(/^['“”]|['“”]$/g, '').replace(/[.!]+$/, '').trim();
    if (value) return value;
  }
  return null;
}

function findTask(tasks: Task[], target: string) {
  const normalized = target.toLocaleLowerCase();
  return tasks.find((task) => task.id === target || task.title.toLocaleLowerCase() === normalized)
    ?? tasks.find((task) => task.title.toLocaleLowerCase().includes(normalized));
}

function renameTaskFromMessage(message: string) {
  const match = message.match(/^(?:please\s+)?(?:rename|change|update)\s+(?:task\s+)?[:\-]?\s*(.+?)\s+(?:to|as)\s+(.+?)[.!]?$/i);
  return match ? { target: match[1].trim(), title: match[2].trim().replace(/[.!]+$/, '') } : null;
}

function checkinFromMessage(message: string) {
  const sleep = message.match(/sleep\s*[:=]?\s*(\d+(?:\.\d+)?)/i)?.[1];
  const energy = message.match(/energy\s*[:=]?\s*([1-5])/i)?.[1];
  const mood = message.match(/mood\s*[:=]?\s*([1-5])/i)?.[1];
  const soreness = message.match(/soreness\s*[:=]?\s*([1-5])/i)?.[1];
  if (!sleep || !energy || !mood || !soreness || !/(?:check\s*in|check-in|morning)/i.test(message)) return null;
  const sleepHours = Number(sleep);
  if (sleepHours < 0 || sleepHours > 24) return null;
  return { sleepMinutes: Math.round(sleepHours * 60), energy: Number(energy), mood: Number(mood), soreness: Number(soreness) };
}

function reviewFromMessage(message: string) {
  const match = message.match(/(?:evening\s+)?review\s*:\s*win\s+(.+?)\s*[;,]\s*(?:reflection|change)\s+(.+?)\s*[;,]\s*energy\s+([1-5])\s*$/i);
  return match ? { win: match[1].trim(), reflection: match[2].trim(), energy: Number(match[3]) } : null;
}

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

  if (/money|budget|spend|transaction|bank/i.test(lower)) return 'Money actions are not connected yet. I can discuss the demo card, but I will not invent or change financial data.';
  if (/calendar|meeting|appointment/i.test(lower)) return 'Calendar actions are not connected yet. Connect Google Calendar before I create or move real events.';

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
  const openTasks = tasks.filter((task) => !task.completed).slice(0, 8);
  const context = {
    readinessScore: readiness(checkin),
    wellbeing: checkin,
    priorities: openTasks.map(({ title, meta }) => ({ title, meta })),
    completedToday: tasks.length - openTasks.length,
  };
  const instructions = 'You are Northstar, a calm personal coach. Use only the supplied daily context. Give one clear recommendation, a short reason, and one concrete next action. Never invent calendar, financial, health, or task data. Do not diagnose or provide medical treatment. Be concise and supportive.';

  if (env.NVIDIA_API_KEY) {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.NVIDIA_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: env.NVIDIA_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
          messages: [
            { role: 'system', content: instructions },
            { role: 'user', content: `Daily context:\n${JSON.stringify(context)}\n\nUser: ${message}` },
          ],
          temperature: 0.2,
          top_p: 0.95,
          max_tokens: 280,
          stream: false,
          chat_template_kwargs: { enable_thinking: false },
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (response.ok) {
        const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const reply = result.choices?.[0]?.message?.content?.trim();
        if (reply) return { reply, mode: 'ai' as const };
      }
    } catch { /* Fall through to the optional OpenAI provider or private guided coach. */ }
  }

  if (env.OPENAI_API_ENABLED !== 'true') return { reply: fallback, mode: 'guided' as const };
  const primaryKey = env.OPENAI_API_KEY;
  if (!primaryKey) return { reply: fallback, mode: 'guided' as const };
  const requestModel = async (apiKey: string) => {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-5.4-mini',
        store: false,
        max_output_tokens: 240,
        instructions,
        input: `Daily context:\n${JSON.stringify(context)}\n\nUser: ${message}`,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return { reply: null, retryable: [408, 429, 500, 502, 503, 504].includes(response.status) };
    const result = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const reply = result.output_text?.trim() || result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text?.trim();
    return { reply: reply || null, retryable: !reply };
  };
  try {
    let result = await requestModel(primaryKey);
    if (!result.reply && result.retryable && env.OPENAI_FALLBACK_API_KEY) result = await requestModel(env.OPENAI_FALLBACK_API_KEY);
    return result.reply ? { reply: result.reply, mode: 'ai' as const } : { reply: fallback, mode: 'guided' as const };
  } catch {
    if (env.OPENAI_FALLBACK_API_KEY) {
      try {
        const result = await requestModel(env.OPENAI_FALLBACK_API_KEY);
        if (result.reply) return { reply: result.reply, mode: 'ai' as const };
      } catch { /* Fall through to the private guided coach. */ }
    }
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
  const savedTasks = (await db.prepare('SELECT id, title, meta, completed, position FROM tasks WHERE user_id = ? ORDER BY position, created_at').bind(user.userId).all<Task>()).results ?? [];
  const requestedTaskTitle = taskTitleFromMessage(message);
  if (requestedTaskTitle) {
    if (requestedTaskTitle.length > 140) return NextResponse.json({ error: 'Keep the task title under 140 characters.' }, { status: 400 });
    const now = Date.now();
    const position = await db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM tasks WHERE user_id = ?').bind(user.userId).first<{ next_position: number }>();
    const task = { id: crypto.randomUUID(), title: requestedTaskTitle, meta: 'Personal · 30 min', completed: 0, position: position?.next_position ?? 0 };
    await db.prepare('INSERT INTO tasks (id, user_id, title, meta, completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)').bind(task.id, user.userId, task.title, task.meta, task.position, now, now).run();
    return NextResponse.json({ reply: `Added “${task.title}” to today’s priorities.`, mode: 'action', action: { type: 'task_created', task } });
  }
  const requestedCompletedTitle = completedTaskTitleFromMessage(message);
  if (requestedCompletedTitle) {
    const task = findTask(savedTasks, requestedCompletedTitle);
    if (!task) return NextResponse.json({ reply: `I couldn’t find a task named “${requestedCompletedTitle}”. Try the exact task title.`, mode: 'action' });
    await db.prepare('UPDATE tasks SET completed = 1, updated_at = ? WHERE id = ? AND user_id = ?').bind(Date.now(), task.id, user.userId).run();
    const updatedTask = { ...task, completed: 1 };
    return NextResponse.json({ reply: `Marked “${task.title}” as done.`, mode: 'action', action: { type: 'task_completed', task: updatedTask } });
  }
  const reopenTarget = taskTarget(message, [
    /^(?:please\s+)?(?:reopen|restore)\s+(?:task\s+)?[:\-]?\s*(.+)$/i,
    /^(?:please\s+)?mark\s+(?:task\s+)?[:\-]?\s*(.+?)\s+as\s+(?:pending|not\s+done|incomplete)$/i,
  ]);
  if (reopenTarget) {
    const task = findTask(savedTasks, reopenTarget);
    if (!task) return NextResponse.json({ reply: `I couldn’t find a task named “${reopenTarget}”.`, mode: 'action' });
    await db.prepare('UPDATE tasks SET completed = 0, updated_at = ? WHERE id = ? AND user_id = ?').bind(Date.now(), task.id, user.userId).run();
    const updatedTask = { ...task, completed: 0 };
    return NextResponse.json({ reply: `Reopened “${task.title}”.`, mode: 'action', action: { type: 'task_updated', task: updatedTask } });
  }
  const deleteTarget = taskTarget(message, [/^(?:please\s+)?(?:delete|remove)\s+(?:task\s+)?[:\-]?\s*(.+)$/i]);
  if (deleteTarget) {
    const task = findTask(savedTasks, deleteTarget);
    if (!task) return NextResponse.json({ reply: `I couldn’t find a task named “${deleteTarget}”.`, mode: 'action' });
    await db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').bind(task.id, user.userId).run();
    return NextResponse.json({ reply: `Deleted “${task.title}”.`, mode: 'action', action: { type: 'task_deleted', task } });
  }
  const renameRequest = renameTaskFromMessage(message);
  if (renameRequest) {
    const task = findTask(savedTasks, renameRequest.target);
    if (!task) return NextResponse.json({ reply: `I couldn’t find a task named “${renameRequest.target}”.`, mode: 'action' });
    if (!renameRequest.title || renameRequest.title.length > 140) return NextResponse.json({ error: 'Keep the new task title between 1 and 140 characters.' }, { status: 400 });
    await db.prepare('UPDATE tasks SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?').bind(renameRequest.title, Date.now(), task.id, user.userId).run();
    const updatedTask = { ...task, title: renameRequest.title };
    return NextResponse.json({ reply: `Renamed “${task.title}” to “${renameRequest.title}”.`, mode: 'action', action: { type: 'task_updated', task: updatedTask } });
  }
  const checkinRequest = checkinFromMessage(message);
  if (checkinRequest) {
    const now = Date.now();
    await db.prepare(`INSERT INTO wellbeing_checkins (id,user_id,checkin_date,sleep_minutes,energy,mood,soreness,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,checkin_date) DO UPDATE SET sleep_minutes=excluded.sleep_minutes,energy=excluded.energy,mood=excluded.mood,soreness=excluded.soreness,updated_at=excluded.updated_at`).bind(crypto.randomUUID(), user.userId, date, checkinRequest.sleepMinutes, checkinRequest.energy, checkinRequest.mood, checkinRequest.soreness, now, now).run();
    return NextResponse.json({ reply: `Saved today’s check-in. Readiness is ${readiness(checkinRequest)}/100.`, mode: 'action', action: { type: 'checkin_saved', checkin: { checkinDate: date, ...checkinRequest } } });
  }
  const reviewRequest = reviewFromMessage(message);
  if (reviewRequest) {
    const now = Date.now();
    await db.prepare(`INSERT INTO daily_reviews (id,user_id,review_date,win,reflection,evening_energy,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id,review_date) DO UPDATE SET win=excluded.win,reflection=excluded.reflection,evening_energy=excluded.evening_energy,updated_at=excluded.updated_at`).bind(crypto.randomUUID(), user.userId, date, reviewRequest.win, reviewRequest.reflection, reviewRequest.energy, now, now).run();
    return NextResponse.json({ reply: 'Saved your evening review and closed the day.', mode: 'action', action: { type: 'review_saved' } });
  }
  if (/^(?:please\s+)?(?:generate|create|replan|plan)\s+(?:my\s+)?(?:day|today|schedule)/i.test(message)) {
    const checkin = await db.prepare('SELECT sleep_minutes AS sleepMinutes, energy, mood, soreness FROM wellbeing_checkins WHERE user_id = ? AND checkin_date = ?').bind(user.userId, date).first<Checkin>();
    const score = readiness(checkin ?? null); let hour = 9;
    const items = savedTasks.filter((task) => !task.completed).slice(0, 4).map((task, index) => { const duration = score < 55 ? 45 : index === 0 ? 75 : 45; const item = { id: task.id, time: `${hour}:00`, title: task.title, type: index === 0 ? 'Focus' : 'Priority', duration }; hour += Math.ceil(duration / 60) + (index === 0 ? 1 : 0); return item; });
    if (!items.length) items.push({ id: 'recovery', time: '9:00', title: 'Choose one meaningful priority', type: 'Planning', duration: 30 });
    const now = Date.now();
    await db.prepare(`INSERT INTO daily_plans (id,user_id,plan_date,items_json,readiness_score,created_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,plan_date) DO UPDATE SET items_json=excluded.items_json,readiness_score=excluded.readiness_score,updated_at=excluded.updated_at`).bind(crypto.randomUUID(), user.userId, date, JSON.stringify(items), score, now, now).run();
    return NextResponse.json({ reply: `Replanned today into ${items.length} focused blocks at readiness ${score}/100.`, mode: 'action', action: { type: 'plan_saved', plan: { items, readinessScore: score } } });
  }
  if (/summary|summarize|how.*(?:day|today)|daily\s+report/i.test(message)) {
    const [todayCheckin, plan, review] = await Promise.all([
      db.prepare('SELECT sleep_minutes AS sleepMinutes, energy, mood, soreness FROM wellbeing_checkins WHERE user_id = ? AND checkin_date = ?').bind(user.userId, date).first<Checkin>(),
      db.prepare('SELECT items_json AS itemsJson FROM daily_plans WHERE user_id = ? AND plan_date = ?').bind(user.userId, date).first<{ itemsJson: string }>(),
      db.prepare('SELECT win, reflection, evening_energy AS eveningEnergy FROM daily_reviews WHERE user_id = ? AND review_date = ?').bind(user.userId, date).first<{ win: string; reflection: string; eveningEnergy: number }>(),
    ]);
    const done = savedTasks.filter((task) => task.completed).length;
    const open = savedTasks.filter((task) => !task.completed);
    const parts = [`Today: ${done} of ${savedTasks.length} tasks complete.`];
    if (todayCheckin) parts.push(`Readiness ${readiness(todayCheckin)}/100.`);
    if (open[0]) parts.push(`Next priority: “${open[0].title}”.`);
    if (plan) parts.push(`${(JSON.parse(plan.itemsJson) as unknown[]).length} planned blocks.`);
    if (review) parts.push(`Win: ${review.win} Evening energy: ${review.eveningEnergy}/5.`);
    return NextResponse.json({ reply: parts.join(' '), mode: 'action', action: { type: 'summary_ready' } });
  }
  const [taskResult, checkin] = await Promise.all([
    db.prepare('SELECT id, title, meta, completed, position FROM tasks WHERE user_id = ? ORDER BY position, created_at').bind(user.userId).all<Task>(),
    db.prepare('SELECT sleep_minutes AS sleepMinutes, energy, mood, soreness FROM wellbeing_checkins WHERE user_id = ? AND checkin_date = ?').bind(user.userId, date).first<Checkin>(),
  ]);
  const tasks = taskResult.results ?? [];
  const result = await generateModelReply(message, tasks, checkin ?? null, coachReply(message, tasks, checkin ?? null));
  return NextResponse.json(result);
}
