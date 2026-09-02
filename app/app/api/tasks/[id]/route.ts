import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureSchema, getD1 } from '@/db';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { id } = await context.params; const body = await request.json() as { completed?: boolean };
  if (typeof body.completed !== 'boolean') return NextResponse.json({ error: 'A completed value is required.' }, { status: 400 });
  const db = getD1(); await ensureSchema(db);
  const result = await db.prepare('UPDATE tasks SET completed = ?, updated_at = ? WHERE id = ? AND user_id = ?').bind(body.completed ? 1 : 0, Date.now(), id, user.userId).run();
  if (!result.meta.changes) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  return NextResponse.json({ id, completed: body.completed });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { id } = await context.params; const db = getD1(); await ensureSchema(db); const result = await db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').bind(id, user.userId).run();
  if (!result.meta.changes) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
