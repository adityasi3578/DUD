import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDailyUpdateSchema, insertGoalSchema, insertProjectSchema, insertProjectUpdateSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Daily Updates (protected)
  app.get("/api/daily-updates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = await storage.getDailyUpdates(userId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily updates" });
    }
  });

  app.get("/api/daily-updates/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const update = await storage.getDailyUpdate(userId, date);
      if (!update) {
        res.status(404).json({ message: "Daily update not found" });
        return;
      }
      res.json(update);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily update" });
    }
  });

  app.post("/api/daily-updates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = insertDailyUpdateSchema.parse(req.body);
      
      // Check if update already exists for this date
      const existing = await storage.getDailyUpdate(userId, updateData.date);
      if (existing) {
        const updated = await storage.updateDailyUpdate(userId, updateData.date, updateData);
        res.json(updated);
      } else {
        const created = await storage.createDailyUpdate(userId, updateData);
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

  // Goals (protected)
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goalData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(userId, goalData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Activities (protected)
  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Projects (protected)
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(userId, projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const project = await storage.updateProject(id, updates);
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Project Updates (protected)
  app.get("/api/projects/:id/updates", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = await storage.getProjectUpdates(id);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project updates" });
    }
  });

  app.post("/api/projects/:id/updates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const updateData = insertProjectUpdateSchema.parse({
        ...req.body,
        projectId: id
      });
      const update = await storage.createProjectUpdate(userId, updateData);
      res.status(201).json(update);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
        return;
      }
      res.status(500).json({ message: "Failed to create project update" });
    }
  });

  // Analytics (protected)
  app.get("/api/analytics/weekly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getWeeklyStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  app.get("/api/analytics/monthly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getMonthlyStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  // Dashboard metrics (protected)
  app.get("/api/dashboard/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const todayUpdate = await storage.getDailyUpdate(userId, today);
      const yesterdayUpdate = await storage.getDailyUpdate(userId, yesterday);
      const monthlyStats = await storage.getMonthlyStats(userId);
      const goals = await storage.getGoals(userId);

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

  // Export functionality (protected)
  app.get("/api/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = await storage.getDailyUpdates(userId);
      const goals = await storage.getGoals(userId);
      const activities = await storage.getActivities(userId, 100);
      const projects = await storage.getProjects(userId);

      const exportData = {
        generatedAt: new Date().toISOString(),
        userId,
        summary: {
          totalUpdates: updates.length,
          totalGoals: goals.length,
          totalActivities: activities.length,
          totalProjects: projects.length
        },
        data: {
          dailyUpdates: updates,
          goals,
          activities,
          projects
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="productivity-data-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}