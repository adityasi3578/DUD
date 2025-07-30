import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDailyUpdateSchema, insertGoalSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = "default-user";

  // Daily Updates
  app.get("/api/daily-updates", async (req, res) => {
    try {
      const updates = await storage.getDailyUpdates(DEFAULT_USER_ID);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily updates" });
    }
  });

  app.get("/api/daily-updates/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const update = await storage.getDailyUpdate(DEFAULT_USER_ID, date);
      if (!update) {
        res.status(404).json({ message: "Daily update not found" });
        return;
      }
      res.json(update);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily update" });
    }
  });

  app.post("/api/daily-updates", async (req, res) => {
    try {
      const updateData = insertDailyUpdateSchema.parse(req.body);
      
      // Check if update already exists for this date
      const existing = await storage.getDailyUpdate(DEFAULT_USER_ID, updateData.date);
      if (existing) {
        const updated = await storage.updateDailyUpdate(DEFAULT_USER_ID, updateData.date, updateData);
        res.json(updated);
      } else {
        const created = await storage.createDailyUpdate(DEFAULT_USER_ID, updateData);
        res.status(201).json(created);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create daily update" });
    }
  });

  // Goals
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals(DEFAULT_USER_ID);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      const created = await storage.createGoal(DEFAULT_USER_ID, goalData);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Activities
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(DEFAULT_USER_ID, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Analytics
  app.get("/api/analytics/weekly", async (req, res) => {
    try {
      const stats = await storage.getWeeklyStats(DEFAULT_USER_ID);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  app.get("/api/analytics/monthly", async (req, res) => {
    try {
      const stats = await storage.getMonthlyStats(DEFAULT_USER_ID);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const todayUpdate = await storage.getDailyUpdate(DEFAULT_USER_ID, today);
      const yesterdayUpdate = await storage.getDailyUpdate(DEFAULT_USER_ID, yesterday);
      const monthlyStats = await storage.getMonthlyStats(DEFAULT_USER_ID);
      const goals = await storage.getGoals(DEFAULT_USER_ID);

      const tasksCompleted = todayUpdate?.tasksCompleted || 0;
      const yesterdayTasks = yesterdayUpdate?.tasksCompleted || 0;
      const tasksChange = tasksCompleted - yesterdayTasks;

      const hoursWorked = todayUpdate ? Math.round(todayUpdate.hoursWorked / 60 * 10) / 10 : 0;
      const totalGoalProgress = goals.length > 0 
        ? Math.round(goals.reduce((sum, goal) => sum + (goal.current / goal.target), 0) / goals.length * 100)
        : 0;

      // Calculate productivity score based on tasks, hours, and goal progress
      const productivityScore = Math.min(100, Math.round(
        (tasksCompleted * 10) + (hoursWorked * 5) + (totalGoalProgress * 0.5)
      ));

      res.json({
        tasksCompleted,
        tasksChange: tasksChange > 0 ? `+${tasksChange} from yesterday` : tasksChange < 0 ? `${tasksChange} from yesterday` : 'Same as yesterday',
        goalProgress: totalGoalProgress,
        timeSpent: `${Math.floor(hoursWorked)}h ${Math.round((hoursWorked % 1) * 60)}m`,
        timeSpentStatus: hoursWorked >= 8 ? 'On track' : hoursWorked >= 6 ? 'Good pace' : 'Behind target',
        productivityScore,
        productivityChange: productivityScore > 80 ? '+5 points' : productivityScore > 60 ? '+2 points' : '-1 point',
        currentStreak: monthlyStats.streak
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Export functionality
  app.get("/api/export", async (req, res) => {
    try {
      const updates = await storage.getDailyUpdates(DEFAULT_USER_ID);
      const goals = await storage.getGoals(DEFAULT_USER_ID);
      const activities = await storage.getActivities(DEFAULT_USER_ID, 100);

      const exportData = {
        generatedAt: new Date().toISOString(),
        dailyUpdates: updates,
        goals,
        activities,
        summary: {
          totalDays: updates.length,
          totalTasks: updates.reduce((sum, u) => sum + u.tasksCompleted, 0),
          totalHours: Math.round(updates.reduce((sum, u) => sum + u.hoursWorked, 0) / 60 * 10) / 10,
          activeGoals: goals.length
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="daily-updates-export.json"');
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
