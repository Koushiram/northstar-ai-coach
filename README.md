# Northstar — Personal AI Coach

Northstar is a proposed personal AI operating system that combines daily planning,
priorities, calendar management, budgeting, fitness and recovery, personal analytics,
and natural voice interaction.

## Product promise

Northstar turns scattered personal data into one calm, actionable plan. It should
answer three questions at any moment:

1. What matters most right now?
2. What should I do next?
3. What should change because of how my day is actually going?

## MVP

The first release focuses on one closed daily loop:

1. Morning check-in: energy, sleep, commitments, and priorities.
2. AI plan: three outcomes plus realistic time blocks.
3. Day execution: tasks, calendar, expenses, and quick voice capture.
4. Adaptive coaching: replan when the user is late, tired, or interrupted.
5. Evening review: progress, spending, wellbeing, and tomorrow's carry-over.

The initial product includes:

- Personal profile, goals, preferences, and coaching style
- Daily dashboard and top-three priorities
- Tasks with duration, energy, urgency, and scheduling constraints
- Google Calendar connection and proposed time blocks
- Manual expense capture, budgets, and weekly summaries
- Sleep, energy, soreness, steps, and workout check-ins
- Text conversation and push-to-talk voice interaction
- Weekly personal report with transparent, evidence-based insights
- Approval controls for calendar edits and other consequential actions

## Not in the first release

- Direct bank transfers or autonomous purchasing
- Medical diagnosis or treatment advice
- Automated investment decisions
- Support for every bank, wearable, and calendar provider
- Fully autonomous changes without a visible approval and undo path

## Repository map

- `docs/PRODUCT.md` — product requirements and user experience
- `docs/ARCHITECTURE.md` — technical design, safety, and AI tool model
- `docs/DATA_MODEL.sql` — implementation-ready PostgreSQL starting schema
- `docs/ROADMAP.md` — staged delivery plan and launch criteria

## Recommended first build

Start with a responsive web application using Next.js, TypeScript, PostgreSQL,
and the OpenAI Responses API. Add Realtime voice after the structured task and
planning tools work reliably. A React Native client can then reuse the same API
and product model.

