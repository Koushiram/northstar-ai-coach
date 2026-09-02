import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), title: text('title').notNull(),
  meta: text('meta').notNull().default('Personal · 30 min'), completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull().default(0), createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_tasks_user_id_id').on(table.userId, table.id)]);

export const wellbeingCheckins = sqliteTable('wellbeing_checkins', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), checkinDate: text('checkin_date').notNull(),
  sleepMinutes: integer('sleep_minutes'), energy: integer('energy'), mood: integer('mood'), soreness: integer('soreness'),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_checkins_user_date').on(table.userId, table.checkinDate)]);

export const dailyPlans = sqliteTable('daily_plans', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), planDate: text('plan_date').notNull(),
  itemsJson: text('items_json').notNull(), readinessScore: integer('readiness_score').notNull(),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_daily_plans_user_date').on(table.userId, table.planDate)]);

export const dailyReviews = sqliteTable('daily_reviews', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), reviewDate: text('review_date').notNull(),
  win: text('win').notNull(), reflection: text('reflection').notNull(), eveningEnergy: integer('evening_energy').notNull(),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_daily_reviews_user_date').on(table.userId, table.reviewDate)]);

export const moneyAccounts = sqliteTable('money_accounts', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), name: text('name').notNull().default('Main balance'),
  balanceCents: integer('balance_cents').notNull().default(0), currency: text('currency').notNull().default('AUD'),
  monthlyBudgetCents: integer('monthly_budget_cents').notNull().default(0), createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_money_accounts_user').on(table.userId)]);

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), amountCents: integer('amount_cents').notNull(),
  category: text('category').notNull().default('Other'), note: text('note').notNull().default('Expense'), spentOn: text('spent_on').notNull(),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (table) => [index('idx_expenses_user_date').on(table.userId, table.spentOn)]);

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), title: text('title').notNull(), area: text('area').notNull().default('Personal'),
  targetValue: integer('target_value').notNull().default(100), currentValue: integer('current_value').notNull().default(0), unit: text('unit').notNull().default('%'),
  targetDate: text('target_date'), status: text('status').notNull().default('active'), createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (table) => [index('idx_goals_user_status').on(table.userId, table.status)]);

export const healthLogs = sqliteTable('health_logs', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), logDate: text('log_date').notNull(), kind: text('kind').notNull(),
  title: text('title').notNull(), detail: text('detail').notNull().default(''), durationMinutes: integer('duration_minutes'), calories: integer('calories'), proteinGrams: integer('protein_grams'),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (table) => [index('idx_health_logs_user_date_kind').on(table.userId, table.logDate, table.kind)]);
