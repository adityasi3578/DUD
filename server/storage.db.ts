import { eq, desc, and, gte, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  teams,
  teamMemberships,
  dailyUpdates,
  goals,
  activities,
  projects,
  projectUpdates,
  userUpdates,
  tasks,
  type User,
  type InsertUser,
  type Team,
  type InsertTeam,
  type TeamMembership,
  type InsertTeamMembership,
  type DailyUpdate,
  type InsertDailyUpdate,
  type Goal,
  type InsertGoal,
  type Activity,
  type InsertActivity,
  type Project,
  type InsertProject,
  type ProjectUpdate,
  type InsertProjectUpdate,
  type UserUpdate,
  type InsertUserUpdate,
  type Task,
  type InsertTask,
} from "@shared/schema";

import { IStorage } from "./storage.impl";

export const dbStorage: IStorage = {
  async getUser(id) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  },
  async getUserByEmail(email) {
    const [u] = await db.select().from(users).where(eq(users.email, email));
    return u;
  },
  async createUser(data) {
    const [u] = await db.insert(users).values(data).returning();
    return u;
  },
  async updateUserStatus(userId, status) {
    const [u] = await db.update(users).set({ status }).where(eq(users.id, userId)).returning();
    return u;
  },
  async updateUserRole(userId, role) {
    const [u] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
    return u;
  },

  async getDailyUpdate(userId, date) {
    const [d] = await db.select().from(dailyUpdates)
      .where(and(eq(dailyUpdates.userId, userId), eq(dailyUpdates.date, date)));
    return d;
  },
  async getDailyUpdates(userId) {
    return db.select().from(dailyUpdates).where(eq(dailyUpdates.userId, userId)).orderBy(desc(dailyUpdates.date));
  },
  async createDailyUpdate(userId, update) {
    const [d] = await db.insert(dailyUpdates).values({ ...update, userId }).returning();
    return d;
  },
  async updateDailyUpdate(userId, date, upd) {
    const [d] = await db.update(dailyUpdates).set(upd)
      .where(and(eq(dailyUpdates.userId, userId), eq(dailyUpdates.date, date)))
      .returning();
    return d;
  },

  async getGoals(userId) {
    return db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.isActive, true)))
      .orderBy(desc(goals.createdAt));
  },
  async createGoal(userId, data) {
    const [g] = await db.insert(goals).values({ ...data, userId }).returning();
    return g;
  },
  async updateGoal(goalId, updates) {
    const [g] = await db.update(goals).set(updates).where(eq(goals.id, goalId)).returning();
    return g;
  },

  async getActivities(userId, limit = 10) {
    return db.select().from(activities).where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp)).limit(limit);
  },
  async createActivity(userId, data) {
    const [a] = await db.insert(activities).values({ ...data, userId }).returning();
    return a;
  },

  async getProjects(userId) {
    return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  },
  async getProject(projectId) {
    const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
    return p;
  },
  async createProject(userId, data) {
    const [p] = await db.insert(projects).values({ ...data, userId }).returning();
    return p;
  },
  async updateProject(projectId, updates) {
    const [p] = await db.update(projects).set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, projectId)).returning();
    return p;
  },

  async getProjectUpdates(projectId) {
    return db.select().from(projectUpdates).where(eq(projectUpdates.projectId, projectId)).orderBy(desc(projectUpdates.createdAt));
  },
  async createProjectUpdate(userId, data) {
    const [u] = await db.insert(projectUpdates).values({ ...data, userId }).returning();
    return u;
  },

  async getWeeklyStats(userId) {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();
    const all = await db.select().from(dailyUpdates)
      .where(and(eq(dailyUpdates.userId, userId), gte(dailyUpdates.date, last7[0])));
    return last7.map(date => ({
      date,
      tasks: all.find(u => u.date === date)?.tasksCompleted ?? 0,
      hours: all.find(u => u.date === date)?.hoursWorked ?? 0
    }));
  },
  async getMonthlyStats(userId) {
    const month = new Date().toISOString().slice(0, 7);
    const all = await db.select().from(dailyUpdates)
      .where(and(eq(dailyUpdates.userId, userId), gte(dailyUpdates.date, `${month}-01`)));
    const tasks = all.reduce((s, u) => s + u.tasksCompleted, 0);
    const hours = all.reduce((s, u) => s + u.hoursWorked, 0);
    return { tasks, hours, streak: 0 };
  },

  async getAllTeams() {
    return db.select().from(teams);
  },
  async createTeam(userId, data) {
    const [t] = await db.insert(teams).values({ ...data, createdBy: userId }).returning();
    return t;
  },
  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  },
  async getAllMemberships() {
    const rows = await db.select().from(teamMemberships)
      .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
      .innerJoin(users, eq(teamMemberships.userId, users.id));
    return rows.map(r => ({
      ...r.team_memberships,
      team: r.teams,
      user: r.users
    }));
  },
  async updateMembershipStatus(id, status) {
    const [m] = await db.update(teamMemberships).set({ status }).where(eq(teamMemberships.id, id)).returning();
    return m;
  },
  async getUserTeams(userId) {
    const rows = await db.select().from(teamMemberships)
      .leftJoin(teams, eq(teamMemberships.teamId, teams.id))
      .where(eq(teamMemberships.userId, userId));
    return rows.map(r => ({ ...r.team_memberships, team: r.teams! }));
  },
  async getTeamProjects(teamId) {
    return db.select().from(projects).where(eq(projects.teamId, teamId));
  },
  async getTeamMembers(teamId) {
    const rows = await db.select().from(teamMemberships)
      .leftJoin(users, eq(teamMemberships.userId, users.id))
      .where(eq(teamMemberships.teamId, teamId));
    return rows.map(r => ({ ...r.team_memberships, user: r.users! }));
  },
  async getTeamUpdates(teamId) {
    const rows = await db.select().from(userUpdates)
      .leftJoin(users, eq(userUpdates.userId, users.id))
      .leftJoin(projects, eq(userUpdates.projectId, projects.id))
      .where(eq(userUpdates.teamId, teamId));
    return rows.map(r => ({ ...r.user_updates, user: r.users!, project: r.projects ?? undefined }));
  },
  async getTeamMetrics(teamId) {
    const projectsList = await this.getTeamProjects(teamId);
    const completed = projectsList.filter(p => p.status === "completed").length;
    return {
      totalProjects: projectsList.length,
      activeProjects: projectsList.filter(p => p.status === "active").length,
      completedProjects: completed,
      totalMembers: (await this.getTeamMembers(teamId)).length,
      totalHours: 0,
      completionRate: projectsList.length > 0 ? (completed * 100 / projectsList.length) : 0
    };
  },
  async createTeamMembership(userId, teamId) {
    const [m] = await db.insert(teamMemberships).values({ userId, teamId, status: "PENDING" }).returning();
    return m;
  },

  async getTasks(userId) {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  },
  async getTask(taskId) {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    return t;
  },
  async createTask(userId, data) {
    const [t] = await db.insert(tasks).values({ ...data, userId }).returning();
    return t;
  },
  async updateTask(taskId, data) {
    const [t] = await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, taskId)).returning();
    return t;
  },
  async getUserTasks(userId) {
    const rows = await db.select().from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.userId, userId));
    return rows.map(r => ({ ...r.tasks, project: r.projects ?? undefined }));
  },
  async getUserRecentTasks(userId) {
    const rows = await db.select().from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.updatedAt))
      .limit(5);
    return rows.map(r => ({ ...r.tasks, project: r.projects ?? undefined }));
  },

  async getUserUpdates(userId) {
    return db.select().from(userUpdates).where(eq(userUpdates.userId, userId)).orderBy(desc(userUpdates.createdAt));
  },
  async createUserUpdate(userId, data) {
    const [u] = await db.insert(userUpdates).values({ ...data, userId }).returning();
    return u;
  },
  async updateUserUpdate(updateId, updates) {
    const [u] = await db.update(userUpdates).set({ ...updates, updatedAt: new Date() })
      .where(eq(userUpdates.id, updateId)).returning();
    return u;
  },

  async getAdminMetrics() {
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    const totalTeams = await db.select({ count: sql`count(*)` }).from(teams);
    const totalProjects = await db.select({ count: sql`count(*)` }).from(projects);
    const totalCompletedProjects = await db.select({ count: sql`count(*)` }).from(projects).where(eq(projects.status, "completed"));
    const totalTasks = await db.select({ count: sql`count(*)` }).from(tasks);
    const totalCompletedTasks = await db.select({ count: sql`count(*)` }).from(tasks).where(eq(tasks.status, "COMPLETED"));

    return {
      totalUsers: totalUsers[0].count,
      totalTeams: totalTeams[0].count,
      totalProjects: totalProjects[0].count,
      activeUsers: totalUsers[0].count,
      pendingUsers: 0,
      completedTasks: totalCompletedTasks[0].count,
      taskCompletionRate: totalTasks[0].count ? Math.round((totalCompletedTasks[0].count / totalTasks[0].count) * 100) : 0,
      projectCompletionRate: totalProjects[0].count ? Math.round((totalCompletedProjects[0].count / totalProjects[0].count) * 100) : 0,
    };
  },

  async getAllProjects() {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  },
  async getRecentUpdates() {
    const rows = await db.select({
      u: userUpdates,
      user: users,
      team: teams
    }).from(userUpdates)
      .leftJoin(users, eq(userUpdates.userId, users.id))
      .leftJoin(teams, eq(userUpdates.teamId, teams.id))
      .orderBy(desc(userUpdates.createdAt))
      .limit(10);

    return rows.map(r => ({ ...r.u, user: r.user!, team: r.team ?? undefined }));
  },

  async getUserMetrics(userId) {
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.status === "COMPLETED").length;
    const inProgressTasks = userTasks.filter(t => t.status === "IN_PROGRESS").length;
    const blockedTasks = userTasks.filter(t => t.status === "BLOCKED").length;
    const totalHours = userTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const today = new Date().toISOString().split("T")[0];
    const todayHours = userTasks.filter(t => t.updatedAt?.toISOString().split("T")[0] === today)
      .reduce((s, t) => s + (t.actualHours || 0), 0);
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const averageTaskTime = completedTasks ? Math.round(totalHours / completedTasks) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      totalHours,
      todayHours,
      completionRate,
      averageTaskTime,
    };
  },
};
