import { randomUUID } from "crypto";
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

import { IStorage } from "./storage";

function now(): Date {
  return new Date();
}

function uuid(): string {
  return randomUUID();
}

export class MemStorage implements IStorage {
  private _users: User[] = [];
  private _dailyUpdates: DailyUpdate[] = [];
  private _projects: Project[] = [];
  private _tasks: Task[] = [];
  private _userUpdates: UserUpdate[] = [];

  async getUser(id: string) {
    return this._users.find((u) => u.id === id);
  }

  async getUserByEmail(email: string) {
    return this._users.find((u) => u.email === email);
  }

  async createUser(user: InsertUser) {
    const newUser: User = {
      ...user,
      id: uuid(),
      createdAt: now(),
    };
    this._users.push(newUser);
    return newUser;
  }

  async upsertUser(user: InsertUser) {
    const existing = await this.getUser(user.id);
    if (existing) return existing;
    return this.createUser(user);
  }

  async updateUserStatus(userId: string, status: string) {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    user.status = status;
    return user;
  }

  async updateUserRole(userId: string, role: string) {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    user.role = role;
    return user;
  }

  async getDailyUpdate(userId: string, date: string) {
    return this._dailyUpdates.find((u) => u.userId === userId && u.date === date);
  }

  async getDailyUpdates(userId: string) {
    return this._dailyUpdates.filter((u) => u.userId === userId);
  }

  async createDailyUpdate(userId: string, update: InsertDailyUpdate) {
    const newUpdate: DailyUpdate = {
      id: uuid(),
      createdAt: now(),
      userId,
      tasksCompleted: update.tasksCompleted ?? 0,
      hoursWorked: update.hoursWorked ?? 0,
      mood: update.mood ?? 0,
      notes: update.notes ?? null,
      date: update.date,
    };
    this._dailyUpdates.push(newUpdate);
    return newUpdate;
  }

  async updateDailyUpdate(userId: string, date: string, update: Partial<InsertDailyUpdate>) {
    const existing = await this.getDailyUpdate(userId, date);
    if (!existing) throw new Error("Update not found");
    Object.assign(existing, update);
    return existing;
  }

  async getGoals(userId: string) {
    return [];
  }

  async createGoal(userId: string, goal: InsertGoal) {
    return { ...goal, id: uuid(), userId, createdAt: now(), updatedAt: now() };
  }

  async updateGoal(goalId: string, updates: Partial<Goal>) {
    throw new Error("Not implemented in memory");
  }

  async getActivities(userId: string, limit = 5) {
    return [];
  }

  async createActivity(userId: string, activity: InsertActivity) {
    return { ...activity, id: uuid(), createdAt: now(), userId };
  }

  async getProjects(userId: string) {
    return this._projects.filter((p) => p.userId === userId);
  }

  async getProject(projectId: string) {
    return this._projects.find((p) => p.id === projectId);
  }

  async createProject(userId: string, project: InsertProject) {
    const newProject: Project = {
      ...project,
      id: uuid(),
      createdAt: now(),
      updatedAt: now(),
      userId,
      status: project.status ?? "active",
      description: project.description ?? null,
      ticketNumber: project.ticketNumber ?? null,
      priority: project.priority ?? "normal",
      dueDate: project.dueDate ?? null,
    };
    this._projects.push(newProject);
    return newProject;
  }

  async updateProject(projectId: string, updates: Partial<InsertProject>) {
    const existing = await this.getProject(projectId);
    if (!existing) throw new Error("Project not found");
    Object.assign(existing, updates);
    existing.updatedAt = now();
    return existing;
  }

  async getProjectUpdates(projectId: string) {
    return [];
  }

  async createProjectUpdate(userId: string, update: InsertProjectUpdate) {
    return { ...update, id: uuid(), userId, createdAt: now() };
  }

  async getUserUpdates(userId: string) {
    return this._userUpdates.filter((u) => u.userId === userId);
  }

  async createUserUpdate(userId: string, update: InsertUserUpdate) {
    const newUpdate: UserUpdate = {
      ...update,
      id: uuid(),
      userId,
      createdAt: now(),
    };
    this._userUpdates.push(newUpdate);
    return newUpdate;
  }

  async updateUserUpdate(updateId: string, updates: Partial<InsertUserUpdate>) {
    const existing = this._userUpdates.find((u) => u.id === updateId);
    if (!existing) throw new Error("Update not found");
    Object.assign(existing, updates);
    return existing;
  }

  async getTasks(userId: string) {
    return this._tasks.filter((t) => t.userId === userId);
  }

  async getTask(taskId: string) {
    return this._tasks.find((t) => t.id === taskId);
  }

  async createTask(userId: string, task: InsertTask) {
    const newTask: Task = {
      ...task,
      id: uuid(),
      userId,
      createdAt: now(),
      updatedAt: now(),
      description: task.description ?? null,
      teamId: task.teamId ?? null,
      ticketNumber: task.ticketNumber ?? null,
      hoursWorked: task.hoursWorked ?? null,
    };
    this._tasks.push(newTask);
    return newTask;
  }

  async updateTask(taskId: string, updates: Partial<InsertTask>) {
    const task = await this.getTask(taskId);
    if (!task) throw new Error("Task not found");
    Object.assign(task, updates);
    task.updatedAt = now();
    return task;
  }

  async getUserTasks(userId: string) {
    return this._tasks.filter((t) => t.userId === userId);
  }

  async getUserRecentTasks(userId: string) {
    return this._tasks.filter((t) => t.userId === userId);
  }

  async getWeeklyStats(userId: string) {
    return [];
  }

  async getMonthlyStats(userId: string) {
    return { tasks: 0, hours: 0, streak: 0 };
  }

  async getAllTeams(): Promise<Team[]> {
    return [];
  }

  async createTeam(userId: string, team: InsertTeam): Promise<Team> {
    return { ...team, id: uuid(), createdAt: now(), updatedAt: now(), ownerId: userId };
  }

  async getAllUsers(): Promise<User[]> {
    return this._users;
  }

  async getAllMemberships(): Promise<(TeamMembership & { team: Team; user: User })[]> {
    return [];
  }

  async updateMembershipStatus(membershipId: string, status: string): Promise<TeamMembership> {
    throw new Error("Not implemented");
  }

  async getUserTeams(userId: string): Promise<(TeamMembership & { team: Team })[]> {
    return [];
  }

  async getTeamProjects(teamId: string): Promise<Project[]> {
    return [];
  }

  async getTeamMembers(teamId: string): Promise<(TeamMembership & { user: User })[]> {
    return [];
  }

  async getTeamUpdates(teamId: string): Promise<(UserUpdate & { user: User; project?: Project })[]> {
    return [];
  }

  async getTeamMetrics(teamId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalMembers: number;
    totalHours: number;
    completionRate: number;
  }> {
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalMembers: 0,
      totalHours: 0,
      completionRate: 0,
    };
  }

  async createTeamMembership(userId: string, teamId: string): Promise<TeamMembership> {
    return {
      id: uuid(),
      userId,
      teamId,
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    };
  }

  async getAdminMetrics() {
    return {
      totalUsers: this._users.length,
      totalTeams: 0,
      totalProjects: this._projects.length,
      activeUsers: this._users.length,
      pendingUsers: 0,
      completedTasks: this._tasks.length,
      taskCompletionRate: 0,
      projectCompletionRate: 0,
    };
  }

  async getAllProjects() {
    return this._projects;
  }

  async getRecentUpdates(): Promise<(UserUpdate & { user: User; team?: Team })[]> {
    return this._userUpdates.map((u) => ({
      ...u,
      user: this._users.find((usr) => usr.id === u.userId)!,
    }));
  }

  async getUserMetrics(userId: string) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      blockedTasks: 0,
      totalHours: 0,
      todayHours: 0,
      completionRate: 0,
      averageTaskTime: 0,
    };
  }
}

export const memStorage = new MemStorage();
