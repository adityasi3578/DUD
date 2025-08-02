import { sql } from 'drizzle-orm';
import {
  index, jsonb, pgTable, text, varchar, integer, timestamp, boolean
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// --- TABLE DEFINITIONS ---

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, table => [index("IDX_session_expire").on(table.expire)]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: varchar("role", { enum: ["USER", "ADMIN"] }).default("USER").notNull(),
  status: varchar("status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).default("PENDING").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: varchar("description").default(""),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamMemberships = pgTable("team_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { enum: ["MEMBER", "LEAD"] }).default("MEMBER").notNull(),
  status: varchar("status", { enum: ["PENDING", "ACTIVE", "INACTIVE"] }).default("PENDING").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
}, table => ({
  uniqueUserTeam: index("unique_user_team").on(table.userId, table.teamId),
}));

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").notNull(),
  ticketNumber: varchar("ticket_number").default(""),
  title: text("title").notNull(),
  description: text("description").default(""),
  status: text("status").notNull().default("active"),
  priority: text("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  ticketNumber: varchar("ticket_number").default(""),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { enum: ["TODO", "IN_PROGRESS", "COMPLETED", "BLOCKED", "REVIEW"] }).default("TODO").notNull(),
  priority: varchar("priority", { enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] }).default("MEDIUM").notNull(),
  estimatedHours: integer("estimated_hours").default(0),
  actualHours: integer("actual_hours").default(0),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userUpdates = pgTable("user_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  ticketNumber: varchar("ticket_number").default(""),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { enum: ["IN_PROGRESS", "COMPLETED", "BLOCKED", "REVIEW"] }).default("IN_PROGRESS").notNull(),
  priority: varchar("priority", { enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] }).default("MEDIUM").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dailyUpdates = pgTable("daily_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: text("date").notNull(),
  tasksCompleted: integer("tasks_completed").default(0).notNull(),
  hoursWorked: integer("hours_worked").default(0).notNull(),
  mood: integer("mood").default(3).notNull(),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  target: integer("target").notNull(),
  current: integer("current").default(0).notNull(),
  type: text("type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const projectUpdates = pgTable("project_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  userId: varchar("user_id").notNull(),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "cascade" }),
  ticketNumber: varchar("ticket_number").default(""),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  hoursWorked: integer("hours_worked").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- SCHEMAS ---

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamMembershipSchema = createInsertSchema(teamMemberships).omit({ id: true, joinedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true, actualHours: true });
export const insertUserUpdateSchema = createInsertSchema(userUpdates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDailyUpdateSchema = createInsertSchema(dailyUpdates).omit({ id: true, createdAt: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, current: true, isActive: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, timestamp: true });
export const insertProjectUpdateSchema = createInsertSchema(projectUpdates).omit({ id: true, createdAt: true });

// --- TYPES ---

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMembership = typeof teamMemberships.$inferSelect;
export type InsertTeamMembership = z.infer<typeof insertTeamMembershipSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UserUpdate = typeof userUpdates.$inferSelect;
export type InsertUserUpdate = z.infer<typeof insertUserUpdateSchema>;
export type DailyUpdate = typeof dailyUpdates.$inferSelect;
export type InsertDailyUpdate = z.infer<typeof insertDailyUpdateSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;
