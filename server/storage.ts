import { 
  users, 
  dailyUpdates, 
  goals, 
  activities, 
  projects,
  projectUpdates,
  type User, 
  type UpsertUser,
  type DailyUpdate, 
  type InsertDailyUpdate, 
  type Goal, 
  type InsertGoal, 
  type Activity, 
  type InsertActivity,
  type Project,
  type InsertProject,
  type ProjectUpdate,
  type InsertProjectUpdate
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods (Replit Auth compatible)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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

  // Project methods
  getProjects(userId: string): Promise<Project[]>;
  getProject(projectId: string): Promise<Project | undefined>;
  createProject(userId: string, project: InsertProject): Promise<Project>;
  updateProject(projectId: string, updates: Partial<InsertProject>): Promise<Project>;

  // Project update methods
  getProjectUpdates(projectId: string): Promise<ProjectUpdate[]>;
  createProjectUpdate(userId: string, update: InsertProjectUpdate): Promise<ProjectUpdate>;

  // Analytics methods
  getWeeklyStats(userId: string): Promise<{ date: string; tasks: number; hours: number }[]>;
  getMonthlyStats(userId: string): Promise<{ tasks: number; hours: number; streak: number }>;
}

export class DatabaseStorage implements IStorage {
  // User methods for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getDailyUpdate(userId: string, date: string): Promise<DailyUpdate | undefined> {
    const [update] = await db
      .select()
      .from(dailyUpdates)
      .where(and(eq(dailyUpdates.userId, userId), eq(dailyUpdates.date, date)));
    return update || undefined;
  }

  async getDailyUpdates(userId: string): Promise<DailyUpdate[]> {
    return await db
      .select()
      .from(dailyUpdates)
      .where(eq(dailyUpdates.userId, userId))
      .orderBy(desc(dailyUpdates.date));
  }

  async createDailyUpdate(userId: string, update: InsertDailyUpdate): Promise<DailyUpdate> {
    const [dailyUpdate] = await db
      .insert(dailyUpdates)
      .values({ ...update, userId })
      .returning();

    // Create activity
    await this.createActivity(userId, {
      type: "task_completed",
      description: `Completed ${update.tasksCompleted || 0} tasks`
    });

    return dailyUpdate;
  }

  async updateDailyUpdate(userId: string, date: string, update: Partial<InsertDailyUpdate>): Promise<DailyUpdate> {
    const [updated] = await db
      .update(dailyUpdates)
      .set(update)
      .where(and(eq(dailyUpdates.userId, userId), eq(dailyUpdates.date, date)))
      .returning();

    if (!updated) {
      throw new Error("Daily update not found");
    }

    return updated;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.isActive, true)))
      .orderBy(desc(goals.createdAt));
  }

  async createGoal(userId: string, goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values({ ...goal, userId })
      .returning();

    // Create activity
    await this.createActivity(userId, {
      type: "goal_added",
      description: `Added new goal: ${goal.title}`
    });

    return newGoal;
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const [updated] = await db
      .update(goals)
      .set(updates)
      .where(eq(goals.id, goalId))
      .returning();

    if (!updated) {
      throw new Error("Goal not found");
    }

    return updated;
  }

  async getActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(userId: string, activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values({ ...activity, userId })
      .returning();
    return newActivity;
  }

  // Project methods
  async getProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(projectId: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    return project;
  }

  async createProject(userId: string, project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, userId })
      .returning();
    return newProject;
  }

  async updateProject(projectId: string, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();
    return updatedProject;
  }

  // Project update methods
  async getProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
    return await db
      .select()
      .from(projectUpdates)
      .where(eq(projectUpdates.projectId, projectId))
      .orderBy(desc(projectUpdates.createdAt));
  }

  async createProjectUpdate(userId: string, update: InsertProjectUpdate): Promise<ProjectUpdate> {
    const [newUpdate] = await db
      .insert(projectUpdates)
      .values({ ...update, userId })
      .returning();
    return newUpdate;
  }

  async getWeeklyStats(userId: string): Promise<{ date: string; tasks: number; hours: number }[]> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const updates = await db
      .select()
      .from(dailyUpdates)
      .where(and(
        eq(dailyUpdates.userId, userId),
        gte(dailyUpdates.date, last7Days[0])
      ));

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
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const monthlyUpdates = await db
      .select()
      .from(dailyUpdates)
      .where(and(
        eq(dailyUpdates.userId, userId),
        gte(dailyUpdates.date, thisMonth + '-01')
      ));

    const totalTasks = monthlyUpdates.reduce((sum, u) => sum + u.tasksCompleted, 0);
    const totalHours = monthlyUpdates.reduce((sum, u) => sum + u.hoursWorked, 0);

    // Calculate current streak
    const allUpdates = await db
      .select()
      .from(dailyUpdates)
      .where(eq(dailyUpdates.userId, userId))
      .orderBy(desc(dailyUpdates.date));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);

    for (const update of allUpdates) {
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

export const storage = new DatabaseStorage();
