import { randomUUID } from 'crypto';
import {
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
} from '@shared/schema';
import type { IStorage } from './storage';

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private teams = new Map<string, Team>();
  private memberships = new Map<string, TeamMembership>();
  private dailyUpdates = new Map<string, DailyUpdate>();
  private goals = new Map<string, Goal>();
  private activities = new Map<string, Activity>();
  private projects = new Map<string, Project>();
  private projectUpdates = new Map<string, ProjectUpdate>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      id,
      createdAt: now,
      updatedAt: now,
      role: 'USER',
      status: 'PENDING',
      profileImageUrl: null,
      ...data,
    } as User;
    this.users.set(id, user);
    return user;
  }

  async updateUserStatus(userId: string, status: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    user.status = status as any;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    user.role = role as any;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  private dailyKey(userId: string, date: string) {
    return `${userId}:${date}`;
  }

  async getDailyUpdate(userId: string, date: string): Promise<DailyUpdate | undefined> {
    return this.dailyUpdates.get(this.dailyKey(userId, date));
  }

  async getDailyUpdates(userId: string): Promise<DailyUpdate[]> {
    return Array.from(this.dailyUpdates.values())
      .filter(u => u.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async createDailyUpdate(userId: string, update: InsertDailyUpdate): Promise<DailyUpdate> {
    const id = randomUUID();
    const daily: DailyUpdate = { id, userId, createdAt: new Date(), ...update } as DailyUpdate;
    this.dailyUpdates.set(this.dailyKey(userId, update.date), daily);
    await this.createActivity(userId, { type: 'task_completed', description: `Completed ${update.tasksCompleted || 0} tasks` });
    return daily;
  }

  async updateDailyUpdate(userId: string, date: string, update: Partial<InsertDailyUpdate>): Promise<DailyUpdate> {
    const key = this.dailyKey(userId, date);
    const existing = this.dailyUpdates.get(key);
    if (!existing) throw new Error('Daily update not found');
    const updated: DailyUpdate = { ...existing, ...update } as DailyUpdate;
    this.dailyUpdates.set(key, updated);
    return updated;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(g => g.userId === userId && g.isActive);
  }

  async createGoal(userId: string, goal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const newGoal: Goal = { id, userId, current: 0, isActive: true, createdAt: new Date(), ...goal } as Goal;
    this.goals.set(id, newGoal);
    await this.createActivity(userId, { type: 'goal_added', description: `Added new goal: ${goal.title}` });
    return newGoal;
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');
    const updated = { ...goal, ...updates } as Goal;
    this.goals.set(goalId, updated);
    return updated;
  }

  async getActivities(userId: string, limit = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createActivity(userId: string, activity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const act: Activity = { id, userId, timestamp: new Date(), ...activity } as Activity;
    this.activities.set(id, act);
    return act;
  }

  async getProjects(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  async getProject(projectId: string): Promise<Project | undefined> {
    return this.projects.get(projectId);
  }

  async createProject(userId: string, project: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    const proj: Project = { id, userId, createdAt: now, updatedAt: now, ...project } as Project;
    this.projects.set(id, proj);
    return proj;
  }

  async updateProject(projectId: string, updates: Partial<InsertProject>): Promise<Project> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found');
    const updated = { ...project, ...updates, updatedAt: new Date() } as Project;
    this.projects.set(projectId, updated);
    return updated;
  }

  async getProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
    return Array.from(this.projectUpdates.values()).filter(u => u.projectId === projectId);
  }

  async createProjectUpdate(userId: string, update: InsertProjectUpdate): Promise<ProjectUpdate> {
    const id = randomUUID();
    const upd: ProjectUpdate = { id, userId, createdAt: new Date(), ...update } as ProjectUpdate;
    this.projectUpdates.set(id, upd);
    return upd;
  }

  async getWeeklyStats(userId: string): Promise<{ date: string; tasks: number; hours: number }[]> {
    const last7: string[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return last7.map(date => {
      const upd = this.dailyUpdates.get(this.dailyKey(userId, date));
      return { date, tasks: upd?.tasksCompleted || 0, hours: upd ? Math.round(upd.hoursWorked / 60 * 10) / 10 : 0 };
    });
  }

  async getMonthlyStats(userId: string): Promise<{ tasks: number; hours: number; streak: number }> {
    const month = new Date().toISOString().slice(0, 7);
    const updates = Array.from(this.dailyUpdates.values()).filter(u => u.userId === userId && u.date.startsWith(month));
    const totalTasks = updates.reduce((s, u) => s + u.tasksCompleted, 0);
    const totalHours = updates.reduce((s, u) => s + u.hoursWorked, 0);
    const all = Array.from(this.dailyUpdates.values()).filter(u => u.userId === userId).sort((a,b)=>b.date.localeCompare(a.date));
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let cur = new Date(today);
    for (const upd of all) {
      const d = new Date(upd.date);
      if (d.toISOString().split('T')[0] === cur.toISOString().split('T')[0]) {
        if (upd.tasksCompleted > 0) {
          streak++;
          cur.setDate(cur.getDate() - 1);
        } else break;
      } else break;
    }
    return { tasks: totalTasks, hours: Math.round(totalHours / 60 * 10) / 10, streak };
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getUserTeams(userId: string): Promise<(TeamMembership & { team: Team })[]> {
    const memberships = Array.from(this.memberships.values()).filter(m => m.userId === userId);
    return memberships.map(m => ({ ...m, team: this.teams.get(m.teamId)! }));
  }

  async getTeamProjects(teamId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.teamId === teamId);
  }

  async getTeamMembers(teamId: string): Promise<(TeamMembership & { user: User })[]> {
    const memberships = Array.from(this.memberships.values()).filter(m => m.teamId === teamId && m.status === 'ACTIVE');
    return memberships.map(m => ({ ...m, user: this.users.get(m.userId)! }));
  }

  async createTeam(userId: string, team: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const now = new Date();
    const t: Team = { id, createdBy: userId, createdAt: now, updatedAt: now, ...team } as Team;
    this.teams.set(id, t);
    return t;
  }

  async joinTeam(userId: string, teamId: string): Promise<TeamMembership> {
    const id = randomUUID();
    const membership: TeamMembership = { id, userId, teamId, role: 'MEMBER', status: 'PENDING', joinedAt: new Date() } as TeamMembership;
    this.memberships.set(id, membership);
    return membership;
  }

  async updateMembershipStatus(membershipId: string, status: string): Promise<TeamMembership> {
    const m = this.memberships.get(membershipId);
    if (!m) throw new Error('Membership not found');
    m.status = status as any;
    this.memberships.set(membershipId, m);
    return m;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllMemberships(): Promise<(TeamMembership & { user: User; team: Team })[]> {
    return Array.from(this.memberships.values()).map(m => ({ ...m, user: this.users.get(m.userId)!, team: this.teams.get(m.teamId)! }));
  }
}

export const memStorage = new MemStorage();
