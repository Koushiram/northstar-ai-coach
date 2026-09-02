'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronRight, CircleDollarSign, Clock3, Flame, HeartPulse, LogIn, Menu, MessageCircle, Mic, Moon, MoreHorizontal, Plus, Sparkles, SunMedium, Target, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Priority = { id: string; title: string; meta: string; completed: boolean | number; position?: number };
type Viewer = { userId: string; displayName: string; email: string };
type Checkin = { checkinDate: string; sleepMinutes: number; energy: number; mood: number; soreness: number };
type PlanItem = { id: string; time: string; title: string; type: string; duration: number };

const demoPriorities: Priority[] = [
  { id: 'demo-1', title: 'Finish Northstar product brief', meta: 'Deep work · 75 min', completed: false },
  { id: 'demo-2', title: 'Review monthly spending', meta: 'Finance · 25 min', completed: false },
  { id: 'demo-3', title: 'Evening strength session', meta: 'Health · 45 min', completed: false },
];

const timeline = [
  { time: '9:30', title: 'Northstar product brief', type: 'Focus', tone: 'focus' },
  { time: '11:00', title: 'Team check-in', type: 'Calendar', tone: 'meeting' },
  { time: '12:30', title: 'Lunch & short walk', type: 'Recovery', tone: 'rest' },
  { time: '2:00', title: 'Open focus block', type: 'Flexible', tone: 'open' },
];

export default function Home() {
  const [priorities, setPriorities] = useState<Priority[]>(demoPriorities);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [editingCheckin, setEditingCheckin] = useState(false);
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [checkinDraft, setCheckinDraft] = useState({ sleepHours: 7.5, energy: 4, mood: 4, soreness: 2 });
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({ win: '', reflection: '', energy: 3 });
  const [reviewSaved, setReviewSaved] = useState(false);
  const [focusActive, setFocusActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [planAdjusted, setPlanAdjusted] = useState(false);
  useEffect(() => {
    const load = async () => {
      const meResponse = await fetch('/api/me', { cache: 'no-store' });
      const me = await meResponse.json() as { user: Viewer | null };
      setViewer(me.user);
      setAuthReady(true);
      if (!me.user) return;
      await fetch('/api/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ seed: true }) });
      const taskResponse = await fetch('/api/tasks', { cache: 'no-store' });
      if (taskResponse.ok) {
        const data = await taskResponse.json() as { tasks: Priority[] };
        setPriorities(data.tasks);
      }
      const localDate = new Date().toLocaleDateString('en-CA');
      const checkinResponse = await fetch(`/api/checkins?date=${localDate}`, { cache: 'no-store' });
      if (checkinResponse.ok) {
        const data = await checkinResponse.json() as { checkin: Checkin | null };
        if (data.checkin) {
          setCheckin(data.checkin);
          setCheckinDraft({ sleepHours: data.checkin.sleepMinutes / 60, energy: data.checkin.energy, mood: data.checkin.mood, soreness: data.checkin.soreness });
        } else setEditingCheckin(true);
      }
      const planResponse = await fetch(`/api/plan?date=${localDate}`, { cache: 'no-store' });
      if (planResponse.ok) { const data = await planResponse.json() as { plan: { items: PlanItem[] } | null }; if (data.plan) setPlanItems(data.plan.items); }
    };
    void load();
  }, []);

  const togglePriority = async (id: string) => {
    const current = priorities.find((priority) => priority.id === id);
    if (!current) return;
    const completed = !Boolean(current.completed);
    setPriorities((items) => items.map((item) => item.id === id ? { ...item, completed } : item));
    if (viewer && !id.startsWith('demo-')) {
      const response = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ completed }) });
      if (!response.ok) setPriorities((items) => items.map((item) => item.id === id ? { ...item, completed: !completed } : item));
    }
  };

  const addTask = async (event: FormEvent) => {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!viewer || !title) return;
    setSavingTask(true);
    const response = await fetch('/api/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title }) });
    if (response.ok) {
      const data = await response.json() as { task: Priority };
      setPriorities((items) => [...items, data.task]);
      setNewTaskTitle(''); setAddingTask(false);
    }
    setSavingTask(false);
  };

  const completedCount = priorities.filter((priority) => Boolean(priority.completed)).length;
  const firstName = viewer?.displayName.split(/\s|@/)[0] || 'Koushiram';
  const initials = viewer ? viewer.displayName.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : 'KN';
  const readinessScore = checkin ? Math.round(Math.min(checkin.sleepMinutes / 480, 1) * 40 + (checkin.energy / 5) * 35 + ((6 - checkin.soreness) / 5) * 25) : 78;
  const recoveryDay = Boolean(checkin && (checkin.energy <= 2 || checkin.sleepMinutes < 360 || checkin.soreness >= 4));

  const saveCheckin = async (event: FormEvent) => {
    event.preventDefault();
    if (!viewer) return;
    setSavingCheckin(true);
    const nextCheckin: Checkin = { checkinDate: new Date().toLocaleDateString('en-CA'), sleepMinutes: Math.round(checkinDraft.sleepHours * 60), energy: checkinDraft.energy, mood: checkinDraft.mood, soreness: checkinDraft.soreness };
    const response = await fetch('/api/checkins', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(nextCheckin) });
    if (response.ok) { setCheckin(nextCheckin); setEditingCheckin(false); }
    setSavingCheckin(false);
  };

  const generatePlan = async () => {
    if (!viewer) return; setGeneratingPlan(true);
    const response = await fetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ date: new Date().toLocaleDateString('en-CA') }) });
    if (response.ok) { const data = await response.json() as { plan: { items: PlanItem[] } }; setPlanItems(data.plan.items); }
    setGeneratingPlan(false);
  };

  const saveReview = async (event: FormEvent) => {
    event.preventDefault(); if (!viewer) return;
    const response = await fetch('/api/review', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ date: new Date().toLocaleDateString('en-CA'), ...reviewDraft }) });
    if (response.ok) { setReviewSaved(true); setReviewOpen(false); }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="hidden w-64 shrink-0 border-r border-border/70 px-5 py-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Sparkles className="size-4" /></div>
            <div><p className="font-semibold tracking-tight">Northstar</p><p className="text-xs text-muted-foreground">Personal intelligence</p></div>
          </div>
          <nav className="mt-10 space-y-1" aria-label="Primary navigation">
            {([['Today', SunMedium], ['Plan', CalendarDays], ['Goals', Target], ['Money', CircleDollarSign], ['Wellbeing', HeartPulse], ['Insights', Flame]] as const).map(([label, Icon], index) => (
              <button key={label} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${index === 0 ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Icon className="size-4" />{label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-border/70 bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><Moon className="size-4 text-violet-500" />Evening review</div>
            <p className="text-sm font-medium">Close the day with intention.</p>
            <Button onClick={() => setReviewOpen(true)} variant="outline" className="mt-4 w-full justify-between">{reviewSaved ? 'Review saved' : 'Start at 8:30 PM'} <ChevronRight /></Button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-4 sm:px-7 lg:px-10 lg:py-7">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu"><Menu /></Button>
              <div><p className="text-sm text-muted-foreground">Wednesday, 2 September</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Good morning, {firstName}</h1></div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Open assistant chat"><MessageCircle /></Button>
              {authReady && !viewer ? (
                <a href="/signin-with-chatgpt?return_to=%2F" target="_top" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"><LogIn className="size-4" /> Sign in</a>
              ) : (
                <div title={viewer?.email || 'Demo mode'} className="grid size-9 place-items-center rounded-full bg-[#d9f3e5] text-sm font-semibold text-[#1a5f47]">{initials}</div>
              )}
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,.75fr)]">
            <div className="space-y-5">
              <Card className="overflow-visible border-0 bg-primary text-primary-foreground ring-0 shadow-[0_24px_70px_-32px_rgba(22,81,63,.7)]">
                <CardHeader className="pb-0">
                  <div className="mb-4 flex items-center gap-2 text-xs font-medium text-primary-foreground/70"><span className="flex size-6 items-center justify-center rounded-full bg-white/10"><Sparkles className="size-3.5" /></span>YOUR NEXT BEST MOVE</div>
                  <CardTitle className="max-w-2xl text-2xl font-medium leading-tight sm:text-3xl">{recoveryDay ? 'Reduce today’s load and protect one focused priority.' : 'Protect the next 75 minutes for the Northstar product brief.'}</CardTitle>
                  <CardDescription className="mt-2 max-w-xl text-primary-foreground/70">{recoveryDay ? 'Your check-in shows limited recovery. Keep the product brief, add more buffer, and make the workout optional.' : 'Your energy is strongest now, and the rest of your morning has enough buffer before the team check-in.'}</CardDescription>
                </CardHeader>
                <CardContent className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => setFocusActive((active) => !active)} className="h-10 bg-white px-4 text-primary hover:bg-white/90">
                    {focusActive ? 'Focus session active' : 'Start focus session'} {focusActive ? <Check /> : <ArrowRight />}
                  </Button>
                  <Button onClick={() => setPlanAdjusted(true)} className="h-10 border-white/20 bg-white/10 px-4 text-white hover:bg-white/15">Adjust my plan</Button>
                </CardContent>
              </Card>

              {planAdjusted && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
                  <span>I’ve protected a 30-minute buffer after lunch and moved the finance review to 4:00 PM.</span>
                  <Button variant="ghost" size="sm" onClick={() => setPlanAdjusted(false)}>Undo</Button>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Today’s priorities</CardTitle><CardDescription>{completedCount} of {priorities.length} complete · {viewer ? 'Saved' : 'Demo mode'}</CardDescription><CardAction><Button onClick={() => setAddingTask((open) => !open)} variant="ghost" size="icon" aria-label="Add priority">{addingTask ? <X /> : <Plus />}</Button></CardAction></CardHeader>
                  <CardContent className="space-y-2">
                    {addingTask && (viewer ? (
                      <form onSubmit={addTask} className="mb-3 flex gap-2 rounded-xl bg-muted/60 p-2">
                        <Input autoFocus value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Add a priority…" maxLength={140} />
                        <Button type="submit" disabled={savingTask || !newTaskTitle.trim()}>{savingTask ? 'Saving' : 'Add'}</Button>
                      </form>
                    ) : (
                      <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        <p className="font-medium">Sign in to save your priorities</p>
                        <p className="mt-1 text-xs text-emerald-800/70">Your tasks will stay private and follow you across devices.</p>
                        <a href="/signin-with-chatgpt?return_to=%2F" target="_top" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4">Continue with ChatGPT <ArrowRight className="size-3" /></a>
                      </div>
                    ))}
                    {priorities.map((priority) => { const done = Boolean(priority.completed); return (
                      <button key={priority.id} onClick={() => togglePriority(priority.id)} className="group flex w-full items-start gap-3 rounded-xl border border-transparent p-2.5 text-left transition-colors hover:border-border hover:bg-muted/50">
                        <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>{done && <Check className="size-3" />}</span>
                        <span className="min-w-0"><span className={`block text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>{priority.title}</span><span className="mt-1 block text-xs text-muted-foreground">{priority.meta}</span></span>
                      </button>
                    ); })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Today’s rhythm</CardTitle><CardDescription>{planItems.length ? `${planItems.length} saved blocks` : 'Generate a plan from your priorities'}</CardDescription><CardAction><Button onClick={generatePlan} disabled={!viewer || generatingPlan} variant="ghost" size="sm">{generatingPlan ? 'Planning…' : planItems.length ? 'Replan' : 'Generate'}</Button></CardAction></CardHeader>
                  <CardContent className="space-y-3">
                    {(planItems.length ? planItems : timeline).map((item) => (
                      <div key={`${item.time}-${item.title}`} className="grid grid-cols-[46px_10px_1fr] items-center gap-3"><span className="text-xs tabular-nums text-muted-foreground">{item.time}</span><span className={`size-2 rounded-full timeline-${'tone' in item ? item.tone : item.type === 'Focus' ? 'focus' : 'open'}`} /><div className="min-w-0 border-b border-border/70 pb-3 last:border-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.type}{'duration' in item ? ` · ${item.duration} min` : ''}</p></div></div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Daily readiness</CardTitle><CardDescription>{checkin ? 'Based on today’s check-in' : 'Complete your morning check-in'}</CardDescription><CardAction>{viewer ? <Button onClick={() => setEditingCheckin((open) => !open)} variant="ghost" size="sm">{editingCheckin ? 'Close' : checkin ? 'Update' : 'Check in'}</Button> : <Badge className="bg-emerald-100 text-emerald-800">Demo</Badge>}</CardAction></CardHeader>
                <CardContent>
                  {editingCheckin && viewer ? (
                    <form onSubmit={saveCheckin} className="space-y-4">
                      <label className="block text-xs font-medium">Sleep last night<input type="number" min="0" max="14" step="0.25" value={checkinDraft.sleepHours} onChange={(event) => setCheckinDraft((draft) => ({ ...draft, sleepHours: Number(event.target.value) }))} className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm" /><span className="mt-1 block font-normal text-muted-foreground">Hours</span></label>
                      {([['Energy', 'energy'], ['Mood', 'mood'], ['Soreness', 'soreness']] as const).map(([label, key]) => <div key={key}><p className="mb-2 text-xs font-medium">{label}</p><div className="grid grid-cols-5 gap-1">{[1,2,3,4,5].map((score) => <button type="button" key={score} onClick={() => setCheckinDraft((draft) => ({ ...draft, [key]: score }))} className={`h-8 rounded-lg border text-xs font-medium ${checkinDraft[key] === score ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>{score}</button>)}</div></div>)}
                      <Button type="submit" className="w-full" disabled={savingCheckin}>{savingCheckin ? 'Saving check-in…' : 'Save morning check-in'}</Button>
                    </form>
                  ) : (
                    <><div className="mb-5 flex items-end gap-3"><span className="text-4xl font-semibold tracking-tight">{readinessScore}</span><span className="pb-1 text-sm text-muted-foreground">/ 100</span></div>
                    <Progress value={readinessScore} className="[&_[data-slot=progress-indicator]]:bg-emerald-500" />
                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">{[['Sleep', checkin ? `${Math.floor(checkin.sleepMinutes / 60)}h ${checkin.sleepMinutes % 60}m` : '7h 18m'], ['Energy', checkin ? `${checkin.energy}/5` : 'Good'], ['Load', recoveryDay ? 'Reduce' : 'Light']].map(([label, value]) => <div key={label} className="rounded-xl bg-muted/60 p-2.5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}</div></>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Money pulse</CardTitle><CardDescription>September · 12 days remaining</CardDescription></CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Safe to spend</p><p className="mt-1 text-2xl font-semibold tracking-tight">$684</p></div><p className="text-xs text-muted-foreground">63% used</p></div>
                  <Progress value={63} className="mt-4 [&_[data-slot=progress-indicator]]:bg-amber-500" />
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-amber-50 p-3 text-amber-900"><div><p className="text-xs font-medium">Dining is trending high</p><p className="mt-0.5 text-xs text-amber-800/70">$46 above your weekly pace</p></div><ChevronRight className="size-4" /></div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="sticky bottom-4 mx-auto mt-7 flex max-w-2xl items-center gap-3 rounded-2xl border border-border bg-card/95 p-2.5 shadow-[0_18px_50px_-25px_rgba(23,50,42,.5)] backdrop-blur">
            <Button onClick={() => setListening((active) => !active)} size="icon-lg" className={`rounded-xl ${listening ? 'animate-pulse bg-red-500 hover:bg-red-500/90' : ''}`} aria-label={listening ? 'Stop voice conversation' : 'Start voice conversation'}><Mic /></Button>
            <button className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">Ask Northstar anything…</span><span className="block truncate text-xs text-muted-foreground">Try “Replan my afternoon” or “Log a $12 lunch”</span></button>
            <div className={`hidden items-center gap-1 text-xs sm:flex ${listening ? 'font-medium text-red-600' : 'text-muted-foreground'}`}><Clock3 className="size-3.5" /> {listening ? 'Listening…' : 'Ready'}</div>
          </div>

          {reviewOpen && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 p-4 backdrop-blur-sm">
              <Card className="w-full max-w-md shadow-2xl">
                <CardHeader><CardTitle>Evening review</CardTitle><CardDescription>Close the loop so tomorrow starts clearly.</CardDescription><CardAction><Button onClick={() => setReviewOpen(false)} variant="ghost" size="icon"><X /></Button></CardAction></CardHeader>
                <CardContent><form onSubmit={saveReview} className="space-y-4">
                  <label className="block text-xs font-medium">What was today’s biggest win?<Input className="mt-1" value={reviewDraft.win} onChange={(e) => setReviewDraft((d) => ({...d, win:e.target.value}))} required /></label>
                  <label className="block text-xs font-medium">What should change tomorrow?<Textarea className="mt-1" value={reviewDraft.reflection} onChange={(e) => setReviewDraft((d) => ({...d, reflection:e.target.value}))} required /></label>
                  <div><p className="mb-2 text-xs font-medium">Evening energy</p><div className="grid grid-cols-5 gap-1">{[1,2,3,4,5].map((score) => <button type="button" key={score} onClick={() => setReviewDraft((d) => ({...d, energy:score}))} className={`h-9 rounded-lg border text-sm ${reviewDraft.energy===score?'bg-primary text-primary-foreground':'bg-background'}`}>{score}</button>)}</div></div>
                  <Button type="submit" className="w-full">Save review & close the day</Button>
                </form></CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
