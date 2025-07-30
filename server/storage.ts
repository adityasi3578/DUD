import { type User, type InsertUser, type DailyUpdate, type InsertDailyUpdate, type Goal, type InsertGoal, type Activity, type InsertActivity, users, dailyUpdates, goals, activities } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
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

// Initialize storage and create default user
async function initializeStorage() {
  try {
    // Check if default user exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, "default-user"));
    
    if (!existingUser) {
      // Create default user
      await db.insert(users).values({
        id: "default-user",
        username: "john.doe",
        password: "password",
        name: "John Doe",
        email: "john@example.com"
      });

      // Create some default goals
      await db.insert(goals).values([
        {
          userId: "default-user",
          title: "Complete 50 tasks",
          target: 50,
          current: 38,
          type: "tasks"
        },
        {
          userId: "default-user",
          title: "Exercise 5 days",
          target: 5,
          current: 3,
          type: "exercise"
        },
        {
          userId: "default-user",
          title: "Read 2 hours",
          target: 120,
          current: 90,
          type: "reading"
        }
      ]);
    }
  } catch (error) {
    console.error("Error initializing storage:", error);
  }
}

// Initialize the database
initializeStorage();

export const storage = new DatabaseStorage();
