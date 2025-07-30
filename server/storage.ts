import { type User, type InsertUser, type DailyUpdate, type InsertDailyUpdate, type Goal, type InsertGoal, type Activity, type InsertActivity } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Daily update methods
  getDailyUpdate(userId: string, date: string): Promise<DailyUpdate | undefined>;
  getDailyUpdates(userId: string): Promise<DailyUpdate[]>;
  createDailyUpdate(userId: string, update: InsertDailyUpdate): Promise<DailyUpdate>;
  updateDailyUpdate(userId: string, date: string, update: Partial<InsertDailyUpdate>): Promise<DailyUpdate>;

  // Goal methods
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(userId: string, goal: InsertGoal): Promise<Goal>;
  updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal>;

  // Activity methods
  getActivities(userId: string, limit?: number): Promise<Activity[]>;
  createActivity(userId: string, activity: InsertActivity): Promise<Activity>;

  // Analytics methods
  getWeeklyStats(userId: string): Promise<{ date: string; tasks: number; hours: number }[]>;
  getMonthlyStats(userId: string): Promise<{ tasks: number; hours: number; streak: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private dailyUpdates: Map<string, DailyUpdate>;
  private goals: Map<string, Goal>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.dailyUpdates = new Map();
    this.goals = new Map();
    this.activities = new Map();

    // Create a default user for demo purposes
    const defaultUser: User = {
      id: "default-user",
      username: "john.doe",
      password: "password",
      name: "John Doe",
      email: "john@example.com"
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create some default goals
    const defaultGoals: Goal[] = [
      {
        id: randomUUID(),
        userId: defaultUser.id,
        title: "Complete 50 tasks",
        target: 50,
        current: 38,
        type: "tasks",
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        userId: defaultUser.id,
        title: "Exercise 5 days",
        target: 5,
        current: 3,
        type: "exercise",
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        userId: defaultUser.id,
        title: "Read 2 hours",
        target: 120,
        current: 90,
        type: "reading",
        isActive: true,
        createdAt: new Date()
      }
    ];

    defaultGoals.forEach(goal => this.goals.set(goal.id, goal));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDailyUpdate(userId: string, date: string): Promise<DailyUpdate | undefined> {
    return Array.from(this.dailyUpdates.values()).find(
      update => update.userId === userId && update.date === date
    );
  }

  async getDailyUpdates(userId: string): Promise<DailyUpdate[]> {
    return Array.from(this.dailyUpdates.values())
      .filter(update => update.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createDailyUpdate(userId: string, update: InsertDailyUpdate): Promise<DailyUpdate> {
    const id = randomUUID();
    const dailyUpdate: DailyUpdate = {
      ...update,
      id,
      userId,
      createdAt: new Date()
    };
    this.dailyUpdates.set(id, dailyUpdate);

    // Create activity
    await this.createActivity(userId, {
      type: "task_completed",
      description: `Completed ${update.tasksCompleted} tasks`
    });

    return dailyUpdate;
  }

  async updateDailyUpdate(userId: string, date: string, update: Partial<InsertDailyUpdate>): Promise<DailyUpdate> {
    const existing = await this.getDailyUpdate(userId, date);
    if (!existing) {
      throw new Error("Daily update not found");
    }

    const updated: DailyUpdate = { ...existing, ...update };
    this.dailyUpdates.set(existing.id, updated);
    return updated;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId && goal.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createGoal(userId: string, goal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const newGoal: Goal = {
      ...goal,
      id,
      userId,
      current: 0,
      isActive: true,
      createdAt: new Date()
    };
    this.goals.set(id, newGoal);

    // Create activity
    await this.createActivity(userId, {
      type: "goal_added",
      description: `Added new goal: ${goal.title}`
    });

    return newGoal;
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const existing = this.goals.get(goalId);
    if (!existing) {
      throw new Error("Goal not found");
    }

    const updated: Goal = { ...existing, ...updates };
    this.goals.set(goalId, updated);
    return updated;
  }

  async getActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createActivity(userId: string, activity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const newActivity: Activity = {
      ...activity,
      id,
      userId,
      timestamp: new Date()
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  async getWeeklyStats(userId: string): Promise<{ date: string; tasks: number; hours: number }[]> {
    const updates = await this.getDailyUpdates(userId);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const update = updates.find(u => u.date === date);
      return {
        date,
        tasks: update?.tasksCompleted || 0,
        hours: update ? Math.round(update.hoursWorked / 60 * 10) / 10 : 0
      };
    });
  }

  async getMonthlyStats(userId: string): Promise<{ tasks: number; hours: number; streak: number }> {
    const updates = await this.getDailyUpdates(userId);
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const monthlyUpdates = updates.filter(u => u.date.startsWith(thisMonth));
    const totalTasks = monthlyUpdates.reduce((sum, u) => sum + u.tasksCompleted, 0);
    const totalHours = monthlyUpdates.reduce((sum, u) => sum + u.hoursWorked, 0);

    // Calculate current streak
    let streak = 0;
    const sortedUpdates = updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);

    for (const update of sortedUpdates) {
      const updateDate = new Date(update.date);
      if (updateDate.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]) {
        if (update.tasksCompleted > 0) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return {
      tasks: totalTasks,
      hours: Math.round(totalHours / 60 * 10) / 10,
      streak
    };
  }
}

export const storage = new MemStorage();
