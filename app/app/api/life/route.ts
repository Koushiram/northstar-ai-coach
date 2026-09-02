import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureSchema, getD1 } from '@/db';

const dateValue = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10);
const textValue = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const db = getD1(); await ensureSchema(db);
  const month = new URL(request.url).searchParams.get('month') || dateValue().slice(0, 7);
  const [account, expenseResult, goalResult, healthResult] = await Promise.all([
    db.prepare('SELECT balance_cents AS balanceCents, currency, monthly_budget_cents AS monthlyBudgetCents FROM money_accounts WHERE user_id = ?').bind(user.userId).first(),
    db.prepare("SELECT id,amount_cents AS amountCents,category,note,spent_on AS spentOn FROM expenses WHERE user_id = ? AND spent_on LIKE ? ORDER BY spent_on DESC,created_at DESC LIMIT 100").bind(user.userId, `${month}%`).all(),
    db.prepare("SELECT id,title,area,target_value AS targetValue,current_value AS currentValue,unit,target_date AS targetDate,status FROM goals WHERE user_id = ? ORDER BY status,created_at DESC").bind(user.userId).all(),
    db.prepare('SELECT id,log_date AS logDate,kind,title,detail,duration_minutes AS durationMinutes,calories,protein_grams AS proteinGrams FROM health_logs WHERE user_id = ? ORDER BY log_date DESC,created_at DESC LIMIT 100').bind(user.userId).all(),
  ]);
  return NextResponse.json({ account: account ?? { balanceCents: 0, currency: 'AUD', monthlyBudgetCents: 0 }, expenses: expenseResult.results ?? [], goals: goalResult.results ?? [], healthLogs: healthResult.results ?? [] });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const body = await request.json() as Record<string, unknown>; const db = getD1(); await ensureSchema(db); const now = Date.now();
  if (body.type === 'balance') {
    const balanceCents = Math.round(Number(body.balance) * 100); const monthlyBudgetCents = Math.round(Number(body.monthlyBudget || 0) * 100);
    if (!Number.isFinite(balanceCents) || balanceCents < 0) return NextResponse.json({ error: 'Enter a valid balance.' }, { status: 400 });
    await db.prepare(`INSERT INTO money_accounts(id,user_id,name,balance_cents,currency,monthly_budget_cents,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET balance_cents=excluded.balance_cents,monthly_budget_cents=CASE WHEN excluded.monthly_budget_cents>0 THEN excluded.monthly_budget_cents ELSE money_accounts.monthly_budget_cents END,updated_at=excluded.updated_at`).bind(crypto.randomUUID(),user.userId,'Main balance',balanceCents,'AUD',monthlyBudgetCents,now,now).run();
  } else if (body.type === 'expense') {
    const amountCents=Math.round(Number(body.amount)*100); if(!Number.isFinite(amountCents)||amountCents<=0) return NextResponse.json({error:'Enter a valid expense.'},{status:400});
    await db.prepare('INSERT INTO expenses(id,user_id,amount_cents,category,note,spent_on,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,amountCents,textValue(body.category,'Other').slice(0,40),textValue(body.note,'Expense').slice(0,120),dateValue(textValue(body.date)),now,now).run();
  } else if (body.type === 'goal') {
    const title=textValue(body.title).trim(); if(!title) return NextResponse.json({error:'Goal title is required.'},{status:400});
    await db.prepare('INSERT INTO goals(id,user_id,title,area,target_value,current_value,unit,target_date,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,title.slice(0,140),textValue(body.area,'Personal'),Math.max(1,Number(body.targetValue)||100),Math.max(0,Number(body.currentValue)||0),textValue(body.unit,'%').slice(0,20),textValue(body.targetDate)||null,'active',now,now).run();
  } else if (body.type === 'health') {
    const title=textValue(body.title).trim(); if(!title) return NextResponse.json({error:'A workout or meal name is required.'},{status:400});
    await db.prepare('INSERT INTO health_logs(id,user_id,log_date,kind,title,detail,duration_minutes,calories,protein_grams,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,dateValue(textValue(body.date)),body.kind==='meal'?'meal':'workout',title.slice(0,140),textValue(body.detail).slice(0,300),Number(body.durationMinutes)||null,Number(body.calories)||null,Number(body.proteinGrams)||null,now,now).run();
  } else return NextResponse.json({error:'Unsupported record type.'},{status:400});
  return GET(request);
}

export async function PATCH(request: Request) {
  const user=await getChatGPTUser(); if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
  const body=await request.json() as {type?:string;id?:string;currentValue?:number;status?:string}; const db=getD1(); await ensureSchema(db);
  if(!body.id)return NextResponse.json({error:'Record id required.'},{status:400});
  if(body.type==='goal'){await db.prepare('UPDATE goals SET current_value=?,status=?,updated_at=? WHERE id=? AND user_id=?').bind(Math.max(0,Number(body.currentValue)||0),body.status==='complete'?'complete':'active',Date.now(),body.id,user.userId).run();}
  else if(body.type==='expense')await db.prepare('DELETE FROM expenses WHERE id=? AND user_id=?').bind(body.id,user.userId).run();
  else if(body.type==='health')await db.prepare('DELETE FROM health_logs WHERE id=? AND user_id=?').bind(body.id,user.userId).run();
  else if(body.type==='goal_delete')await db.prepare('DELETE FROM goals WHERE id=? AND user_id=?').bind(body.id,user.userId).run();
  else return NextResponse.json({error:'Unsupported update.'},{status:400});
  return GET(request);
}
