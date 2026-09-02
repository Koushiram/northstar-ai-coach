# Delivery roadmap

## Phase 0 — validate the daily loop (1 week)

- Interview five target users about their current planning routine
- Test a clickable Today-screen prototype
- Validate the morning briefing, “what now?” action, and evening review
- Define the product's tone and choose a final name

Exit criterion: users can explain the value after one minute and prefer the proposed
daily loop to their current combination of task and calendar tools.

## Phase 1 — working personal planner (2–3 weeks)

- Authentication and onboarding
- Goals, tasks, top-three priorities, and check-ins
- Daily plan generation and approval
- Today timeline, progress, and evening review
- Text assistant using typed, server-side tools
- Audit history for all AI-created changes

Exit criterion: ten test users can plan and complete a full week without data loss or
unexplained AI actions.

## Phase 2 — calendar and voice (2 weeks)

- Google Calendar read integration
- Proposed calendar blocks with confirmation and undo
- Push-to-talk realtime conversation with transcript
- Notification preferences and reminders

Exit criterion: more than 80% of proposed calendar actions execute correctly, and no
external write occurs without explicit confirmation.

## Phase 3 — money and recovery (2–3 weeks)

- Manual/CSV transactions, budgets, bills, and savings goals
- Wellbeing check-ins, workouts, and recovery-aware plans
- Weekly cross-domain report with evidence and confidence
- Privacy controls, export, and deletion

Exit criterion: users judge at least half of weekly insights genuinely useful and can
trace every insight back to supporting data.

## Phase 4 — private beta

- Mobile client and push notifications
- Selected wearable and financial data integrations
- Reliability, accessibility, security, and performance review
- Feedback capture and controlled rollout

## Immediate build backlog

1. Create the responsive Today screen with realistic sample data.
2. Implement task CRUD and the morning energy/recovery check-in.
3. Add a deterministic planning service before connecting an AI model.
4. Expose planning and task operations as validated tools.
5. Add AI conversation and retain tool/audit traces.
6. Add calendar read access, then the proposal/confirmation write flow.
7. Add voice only after text actions are reliable.

