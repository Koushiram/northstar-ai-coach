# Architecture

## Suggested stack

- Web: Next.js, TypeScript, Tailwind, and accessible component primitives
- Mobile after validation: React Native with Expo
- API: Next.js server routes initially; split into a service only when needed
- Database: PostgreSQL with row-level security
- Authentication: passkeys, email magic links, and optional social sign-in
- AI: OpenAI Responses API for reasoning/tool use; Realtime API for voice
- Jobs: durable queue for imports, reminders, reports, and integration sync
- Observability: structured logs, model/tool traces, audit events, and user feedback

## System boundaries

The language model is the planner and conversational layer, not the source of truth.
Tasks, events, transactions, goals, measurements, preferences, and permissions live
as structured records. The model reads narrowly scoped views and invokes typed tools.

```text
Web / Mobile / Voice
        |
Application API + authorization
        |
Conversation orchestrator ---- Policy and approval engine
        |                              |
Typed domain tools               Audit log / undo
        |
PostgreSQL + job queue + integration adapters
```

## Initial AI tools

- `get_today_context(date)`
- `list_tasks(status, date_range)`
- `create_task(draft)`
- `update_task(draft_change)`
- `draft_daily_plan(date, constraints)`
- `approve_daily_plan(plan_id)`
- `list_calendar_events(date_range)`
- `propose_calendar_changes(changes)`
- `confirm_calendar_changes(proposal_id)`
- `record_expense(amount, category, occurred_at, note)`
- `get_budget_status(period)`
- `record_wellbeing_checkin(values)`
- `record_workout(values)`
- `get_weekly_metrics(week)`

Every mutating tool validates ownership and input server-side. Calendar changes use a
two-step proposal/confirmation flow. High-impact operations are not exposed initially.

## Memory model

Use four distinct forms of memory:

1. **Profile:** stable facts explicitly provided by the user.
2. **Preferences:** editable choices such as tone, working hours, and notifications.
3. **History:** structured task, financial, calendar, and wellbeing events.
4. **Learned observations:** time-limited inferences with evidence and confidence.

The user can inspect, correct, or delete all four. Learned observations expire unless
confirmed by repeated evidence or the user.

## Planning algorithm

1. Gather available time, fixed events, deadlines, energy, and current goals.
2. Rank candidate tasks using importance, urgency, goal alignment, and deferral cost.
3. Filter by constraints and match demanding tasks to likely high-energy windows.
4. Reserve buffers and avoid filling more than roughly 70–80% of flexible time.
5. Produce a plan plus explicit omissions and trade-offs.
6. Require user approval before calendar writes.
7. Compare planned and actual results to improve duration estimates.

## Privacy and safety

- Encrypt data in transit and at rest; use provider token vaulting.
- Store the minimum integration scopes and support immediate revocation.
- Never place access tokens, complete financial records, or raw health histories in prompts.
- Use data summaries and scoped retrieval for model context.
- Log tool requests and results without sensitive payloads.
- Support export and deletion of user data.
- Clearly label financial coaching as budgeting support, not regulated financial advice.
- Clearly label fitness suggestions as general wellbeing support, not medical advice.
- Use rate limits, idempotency keys, confirmations, and undo for external writes.

## Voice flow

1. Client streams microphone audio after an explicit push-to-talk action.
2. Realtime session transcribes and responds conversationally.
3. Tool calls pass through the same authenticated server-side policy layer as text.
4. The client displays the transcript and any proposed action.
5. The user confirms consequential writes by voice or touch.

