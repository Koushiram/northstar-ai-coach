'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronRight, CircleDollarSign, Clock3, Flame, HeartPulse, LogIn, Menu, MessageCircle, Mic, Moon, MoreHorizontal, Plus, Sparkles, SunMedium, Target, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

type Priority = { id: string; title: string; meta: string; completed: boolean | number; position?: number };
type Viewer = { userId: string; displayName: string; email: string };

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
            <Button variant="outline" className="mt-4 w-full justify-between">Start at 8:30 PM <ChevronRight /></Button>
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
                  <CardTitle className="max-w-2xl text-2xl font-medium leading-tight sm:text-3xl">Protect the next 75 minutes for the Northstar product brief.</CardTitle>
                  <CardDescription className="mt-2 max-w-xl text-primary-foreground/70">Your energy is strongest now, and the rest of your morning has enough buffer before the team check-in.</CardDescription>
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
                  <CardHeader><CardTitle>Today’s rhythm</CardTitle><CardDescription>4 planned blocks · 1h 30m flexible</CardDescription><CardAction><Button variant="ghost" size="icon" aria-label="More schedule options"><MoreHorizontal /></Button></CardAction></CardHeader>
                  <CardContent className="space-y-3">
                    {timeline.map((item) => (
                      <div key={item.time} className="grid grid-cols-[46px_10px_1fr] items-center gap-3"><span className="text-xs tabular-nums text-muted-foreground">{item.time}</span><span className={`size-2 rounded-full timeline-${item.tone}`} /><div className="min-w-0 border-b border-border/70 pb-3 last:border-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.type}</p></div></div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle>Daily readiness</CardTitle><CardAction><Badge className="bg-emerald-100 text-emerald-800">Balanced</Badge></CardAction></CardHeader>
                <CardContent>
                  <div className="mb-5 flex items-end gap-3"><span className="text-4xl font-semibold tracking-tight">78</span><span className="pb-1 text-sm text-muted-foreground">/ 100</span></div>
                  <Progress value={78} className="[&_[data-slot=progress-indicator]]:bg-emerald-500" />
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">{[['Sleep', '7h 18m'], ['Energy', 'Good'], ['Load', 'Light']].map(([label, value]) => <div key={label} className="rounded-xl bg-muted/60 p-2.5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}</div>
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
        </section>
      </div>
    </main>
  );
}
