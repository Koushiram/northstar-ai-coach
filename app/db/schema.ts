import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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

