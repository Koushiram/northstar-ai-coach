# Product requirements

## Working name

**Northstar** — a calm, proactive personal AI coach.

## Target user

A busy person who currently uses several disconnected tools for tasks, calendar,
money, fitness, and reflection, but still struggles to decide what to do next.

## Core job

Help the user make and follow a realistic daily plan while protecting their money,
health, recovery, and long-term goals.

## Product principles

- Recommend one clear next action, not ten generic suggestions.
- Explain why a recommendation was made and which data influenced it.
- Ask before changing external systems; make changes reversible.
- Treat plans as adjustable hypotheses, never moral judgments.
- Separate facts, user-entered data, and AI inference in the interface.
- Minimize manual entry through conversation and sensible defaults.
- Avoid shame language in productivity, finance, food, and fitness experiences.

## Primary user journey

### 1. Onboarding

The user chooses goals, normal working hours, sleep target, preferred coaching tone,
currency, budget cycle, fitness level, and which integrations to connect. The app
starts useful with manual entry; integrations are optional.

### 2. Morning briefing

Northstar asks for energy and recovery, reads today's commitments, identifies the
most important outcomes, and drafts a realistic plan. The user approves or edits it.

### 3. Today screen

The first viewport shows:

- Current time and next calendar commitment
- A prominent “What should I do now?” recommendation
- Top three outcomes with progress
- Today's timeline and protected focus blocks
- Compact money and recovery status
- A persistent text/voice capture control

### 4. Adaptive replanning

If a meeting runs late or the user reports low energy, Northstar proposes a revised
plan. It identifies what moved, what was dropped, and why. It never silently changes
an external calendar in the MVP.

### 5. Evening review

The user records wins, unfinished work, energy, spending, and a short reflection.
Northstar carries forward only intentional tasks and drafts tomorrow's starting plan.

### 6. Weekly review

The app summarizes outcomes, schedule accuracy, spending, sleep/recovery, and habits.
It highlights correlations as observations, not causal claims, and recommends at most
three experiments for the next week.

## Feature requirements

### Tasks and priorities

- Capture via form, text, or voice
- Attributes: outcome, deadline, duration, energy, context, and importance
- Daily top three distinct from the full backlog
- Recurring tasks, subtasks, completion, deferral, and intentional deletion
- AI scheduling proposals that respect working hours and existing events

### Calendar

- Read events and availability
- Draft time blocks and resolve conflicts
- Require approval before creating, moving, or deleting events
- Show a before/after preview and retain an audit log

### Money

- Manual and CSV expense capture in the MVP
- Categories, monthly budgets, recurring bills, and savings goals
- Remaining safe-to-spend estimate with assumptions displayed
- Weekly review and unusual-spend detection
- No movement of money or investment instructions

### Fitness and recovery

- Daily sleep, energy, soreness, mood, steps, and workout check-in
- Planned workouts and completion tracking
- Suggestions can adjust intensity but must not diagnose conditions
- Persistent health warnings route the user to a qualified professional

### Voice

- Push-to-talk first; hands-free wake word is out of scope for MVP
- Live transcript and visible listening/speaking states
- User can interrupt playback
- Any proposed write action is summarized for confirmation
- Sensitive financial and health responses are not spoken on a locked device

### Personal analytics

- Plan accuracy: planned versus completed work
- Time estimation accuracy
- Focus-time consistency
- Budget utilization and category trends
- Sleep/recovery trends
- Insight cards include evidence, confidence, and an explanation

## Success measures

- At least 60% of activated users complete four morning briefings in week one
- At least 50% complete two evening reviews in week one
- Median approved daily plan contains no more than five scheduled work blocks
- Less than 10% of accepted plans require immediate manual reconstruction
- Users rate weekly insights as useful at least 4/5
- Zero unapproved external calendar writes

