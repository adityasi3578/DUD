import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateUser, createUser } from "./auth";
import { insertDailyUpdateSchema, insertGoalSchema, insertProjectSchema, insertProjectUpdateSchema, insertUserUpdateSchema, insertTaskSchema, type Task, type Goal } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.set("trust proxy", 1);
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Allow cross-site cookies when deployed with HTTPS
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: sessionTtl,
    },
  }));

  // Auth middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const user = await createUser({ email, password, firstName, lastName });
      res.status(201).json({ message: "Account created successfully. Awaiting admin approval." });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/signin", async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.status !== "APPROVED") {
        return res.status(403).json({ message: "Account is pending approval" });
      }

      req.session.userId = user.id;
      res.json(user);
    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ message: "Failed to sign in" });
    }
  });

  app.post("/api/auth/signout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Failed to sign out" });
      }
      res.json({ message: "Signed out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't send password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Daily Updates (protected)
  app.get("/api/daily-updates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const updates = await storage.getDailyUpdates(userId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily updates" });
    }
  });

  app.get("/api/daily-updates/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
      const stats = await storage.getWeeklyStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  app.get("/api/analytics/monthly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const stats = await storage.getMonthlyStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  // Dashboard metrics (protected)
  app.get("/api/dashboard/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const userMetrics = await storage.getUserMetrics(userId);
      const goals = await storage.getGoals(userId);

      // Calculate today's completed tasks based on task completion date
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Get tasks completed today vs yesterday
      const allUserTasks = await storage.getUserTasks(userId);
      const todayCompletedTasks = allUserTasks.filter((task: Task) =>
        task.status === "COMPLETED" &&
        task.updatedAt?.toISOString().split('T')[0] === today
      ).length;

      const yesterdayCompletedTasks = allUserTasks.filter((task: Task) =>
        task.status === "COMPLETED" &&
        task.updatedAt?.toISOString().split('T')[0] === yesterday
      ).length;

      const tasksChange = todayCompletedTasks - yesterdayCompletedTasks;

      // Calculate total goal progress
      const totalGoalProgress = goals.length > 0
        ? Math.round(
            goals.reduce((sum: number, goal: Goal) => sum + goal.current / goal.target, 0) /
            goals.length *
            100
          )
        : 0;

      // Calculate hours worked from actual tasks
      const hoursWorked = userMetrics.todayHours;
      
      // Calculate productivity score based on completion rate and hours
      const productivityScore = Math.min(100, Math.round(
        (userMetrics.completionRate * 0.6) + (Math.min(hoursWorked, 8) * 5) + (totalGoalProgress * 0.4)
      ));

      // Calculate streak from recent activity
      const recentTasks = allUserTasks
        .filter((task: Task) => task.status === "COMPLETED")
        .sort(
          (a: Task, b: Task) =>
            new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        );
      
      let streak = 0;
      const dates = new Set();
      for (const task of recentTasks) {
        const date = task.updatedAt?.toISOString().split('T')[0];
        if (date) dates.add(date);
        if (dates.size > 7) break;
      }
      streak = dates.size;

      res.json({
        tasksCompleted: todayCompletedTasks,
        tasksChange: tasksChange > 0 ? `+${tasksChange} from yesterday` : tasksChange < 0 ? `${tasksChange} from yesterday` : 'Same as yesterday',
        goalProgress: totalGoalProgress,
        timeSpent: `${Math.floor(hoursWorked)}h ${Math.round((hoursWorked % 1) * 60)}m`,
        timeSpentStatus: hoursWorked >= 8 ? 'On track' : hoursWorked >= 6 ? 'Good pace' : 'Behind target',
        productivityScore,
        productivityChange: productivityScore > 80 ? '+5 points' : productivityScore > 60 ? '+2 points' : '-1 point',
        currentStreak: streak
      });
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Export functionality (protected)
  app.get("/api/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
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

  // Admin middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };

  // Admin routes
  app.get("/api/admin/teams", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/admin/teams", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const team = await storage.createTeam(userId, req.body);
      res.json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.patch("/api/admin/users/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = await storage.updateUserStatus(id, status);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/memberships", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const memberships = await storage.getAllMemberships();
      res.json(memberships);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      res.status(500).json({ message: "Failed to fetch memberships" });
    }
  });

  app.patch("/api/admin/memberships/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const membership = await storage.updateMembershipStatus(id, status);
      res.json(membership);
    } catch (error) {
      console.error("Error updating membership:", error);
      res.status(500).json({ message: "Failed to update membership" });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Team routes
  app.get("/api/teams", isAuthenticated, async (req: any, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Team projects route
  app.get("/api/teams/:teamId/projects", isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const projects = await storage.getTeamProjects(teamId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching team projects:", error);
      res.status(500).json({ message: "Failed to fetch team projects" });
    }
  });

  // Team members route
  app.get("/api/teams/:teamId/members", isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Team updates route
  app.get("/api/teams/:teamId/updates", isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const updates = await storage.getTeamUpdates(teamId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching team updates:", error);
      res.status(500).json({ message: "Failed to fetch team updates" });
    }
  });

  // Team metrics route
  app.get("/api/teams/:teamId/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const metrics = await storage.getTeamMetrics(teamId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching team metrics:", error);
      res.status(500).json({ message: "Failed to fetch team metrics" });
    }
  });

  // Admin dashboard metrics
  app.get("/api/admin/metrics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const metrics = await storage.getAdminMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ message: "Failed to fetch admin metrics" });
    }
  });

  // Admin projects
  app.get("/api/admin/projects", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Admin recent updates
  app.get("/api/admin/recent-updates", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updates = await storage.getRecentUpdates();
      res.json(updates);
    } catch (error) {
      console.error("Error fetching recent updates:", error);
      res.status(500).json({ message: "Failed to fetch recent updates" });
    }
  });

  // User dashboard metrics
  app.get("/api/user/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const userMetrics = await storage.getUserMetrics(userId);
      
      // Get user's projects
      const userProjects = await storage.getProjects(userId);
      const totalProjects = userProjects.length;
      const completedProjects = userProjects.filter((p: any) => p.status === "completed").length;
      const projectCompletionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

      res.json({
        totalTasks: userMetrics.totalTasks,
        completedTasks: userMetrics.completedTasks,
        inProgressTasks: userMetrics.inProgressTasks,
        blockedTasks: userMetrics.blockedTasks,
        totalProjects,
        completedProjects,
        taskCompletionRate: userMetrics.completionRate,
        projectCompletionRate
      });
    } catch (error) {
      console.error("Error fetching user metrics:", error);
      res.status(500).json({ message: "Failed to fetch user metrics" });
    }
  });

  // User tasks
  app.get("/api/user/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const tasks = await storage.getUserTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch user tasks" });
    }
  });

  // User recent tasks
  app.get("/api/user/recent-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const tasks = await storage.getUserRecentTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching recent tasks:", error);
      res.status(500).json({ message: "Failed to fetch recent tasks" });
    }
  });

  // User team routes
  app.get("/api/user/teams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const teams = await storage.getUserTeams(userId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/user/join-team", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { teamId } = req.body;
      const membership = await storage.createTeamMembership(userId, teamId);
      res.json(membership);
    } catch (error) {
      console.error("Error joining team:", error);
      res.status(500).json({ message: "Failed to join team" });
    }
  });

  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const tasks = await storage.getUserTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch user tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Clean the request body - convert empty strings to null for optional foreign keys
      const cleanedBody = {
        ...req.body,
        teamId: req.body.teamId?.trim() || null,
        projectId: req.body.projectId?.trim() || null,
        ticketNumber: req.body.ticketNumber?.trim() || null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      };
      
      const validatedData = insertTaskSchema.parse(cleanedBody);
      const task = await storage.createTask(userId, validatedData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      
      // Verify task belongs to user
      const existingTask = await storage.getTask(id);
      if (!existingTask || existingTask.userId !== userId) {
        return res.status(404).json({ message: "Task not found" });
      }

      const cleanedBody = {
        ...req.body,
        teamId: req.body.teamId?.trim() || null,
        projectId: req.body.projectId?.trim() || null,
        ticketNumber: req.body.ticketNumber?.trim() || null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      };
      
      const task = await storage.updateTask(id, cleanedBody);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // User Updates routes
  app.get("/api/user-updates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const updates = await storage.getUserUpdates(userId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching user updates:", error);
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  });

  app.post("/api/user-updates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Clean the request body - convert empty strings to null for optional foreign keys
      const cleanedBody = {
        ...req.body,
        teamId: req.body.teamId?.trim() || null,
        projectId: req.body.projectId?.trim() || null,
        taskId: req.body.taskId?.trim() || null,
        ticketNumber: req.body.ticketNumber?.trim() || null,
      };
      
      console.log("Original body:", req.body);
      console.log("Cleaned body:", cleanedBody);
      
      const validatedData = insertUserUpdateSchema.parse(cleanedBody);
      const update = await storage.createUserUpdate(userId, validatedData);

      // If a task is associated and the update status is COMPLETED, update the task status
      if (update.taskId && update.status === "COMPLETED") {
        await storage.updateTask(update.taskId, { status: "COMPLETED" });
      }

      res.json(update);
    } catch (error) {
      console.error("Error creating user update:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create update" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}