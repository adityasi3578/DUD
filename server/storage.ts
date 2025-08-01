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
  type InsertTask
} from "@shared/schema";
import { db } from "./db";
import { memStorage } from "./mem-storage";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(userId: string, status: string): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;

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

  // Team management methods
  getAllTeams(): Promise<Team[]>;
  createTeam(userId: string, team: InsertTeam): Promise<Team>;
  getAllUsers(): Promise<User[]>;
  getAllMemberships(): Promise<(TeamMembership & { team: Team, user: User })[]>;
  updateMembershipStatus(membershipId: string, status: string): Promise<TeamMembership>;
  getUserTeams(userId: string): Promise<(TeamMembership & { team: Team })[]>;
  getTeamProjects(teamId: string): Promise<Project[]>;
  getTeamMembers(teamId: string): Promise<(TeamMembership & { user: User })[]>;
  getTeamUpdates(teamId: string): Promise<(UserUpdate & { user: User, project?: Project })[]>;
  getTeamMetrics(teamId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalMembers: number;
    totalHours: number;
    completionRate: number;
  }>;
  createTeamMembership(userId: string, teamId: string): Promise<TeamMembership>;

  // Task methods
  getTasks(userId: string): Promise<Task[]>;
  getTask(taskId: string): Promise<Task | undefined>;
  createTask(userId: string, task: InsertTask): Promise<Task>;
  updateTask(taskId: string, updates: Partial<InsertTask>): Promise<Task>;
  getUserTasks(userId: string): Promise<(Task & { project?: Project })[]>;

  // User update methods
  getUserUpdates(userId: string): Promise<UserUpdate[]>;
  createUserUpdate(userId: string, update: InsertUserUpdate): Promise<UserUpdate>;
  updateUserUpdate(updateId: string, updates: Partial<InsertUserUpdate>): Promise<UserUpdate>;

  // Admin dashboard methods
  getAdminMetrics(): Promise<{
    totalUsers: number;
    totalTeams: number;
    totalProjects: number;
    activeUsers: number;
    pendingUsers: number;
    completedTasks: number;
    taskCompletionRate: number;
    projectCompletionRate: number;
  }>;
  getAllProjects(): Promise<Project[]>;
  getRecentUpdates(): Promise<(UserUpdate & { user: User; team?: Team })[]>;

  // User dashboard methods
  getUserMetrics(userId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    totalHours: number;
    todayHours: number;
    completionRate: number;
    averageTaskTime: number;
  }>;
  getUserRecentTasks(userId: string): Promise<(Task & { project?: Project })[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserStatus(userId: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status: status as "PENDING" | "APPROVED" | "REJECTED", updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as "USER" | "ADMIN", updatedAt: new Date() })
      .where(eq(users.id, userId))
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
    // Auto-generate ticket number if not provided
    const ticketNumber = project.ticketNumber || `PROJ-${Date.now().toString().slice(-6)}`;
    
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, ticketNumber, userId })
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
    // Auto-generate ticket number if not provided
    const ticketNumber = update.ticketNumber || `UPD-${Date.now().toString().slice(-6)}`;
    
    const [newUpdate] = await db
      .insert(projectUpdates)
      .values({ ...update, ticketNumber, userId })
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



  // Team management methods
  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async createTeam(userId: string, team: InsertTeam): Promise<Team> {
    const [newTeam] = await db
      .insert(teams)
      .values({ ...team, createdBy: userId })
      .returning();
    return newTeam;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllMemberships(): Promise<(TeamMembership & { team: Team, user: User })[]> {
    return await db
      .select()
      .from(teamMemberships)
      .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
      .innerJoin(users, eq(teamMemberships.userId, users.id))
      .orderBy(desc(teamMemberships.joinedAt))
      .then(rows => rows.map(row => ({
        ...row.team_memberships,
        team: row.teams,
        user: row.users
      })));
  }

  async updateMembershipStatus(membershipId: string, status: string): Promise<TeamMembership> {
    const [membership] = await db
      .update(teamMemberships)
      .set({ status: status as "PENDING" | "ACTIVE" | "INACTIVE" })
      .where(eq(teamMemberships.id, membershipId))
      .returning();
    return membership;
  }

  async getUserTeams(userId: string): Promise<(TeamMembership & { team: Team })[]> {
    return await db
      .select()
      .from(teamMemberships)
      .leftJoin(teams, eq(teamMemberships.teamId, teams.id))
      .where(eq(teamMemberships.userId, userId))
      .then(rows => rows.map(row => ({
        ...row.team_memberships,
        team: row.teams!
      })));
  }

  async getTeamProjects(teamId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.teamId, teamId));
  }

  async getTeamMembers(teamId: string): Promise<(TeamMembership & { user: User })[]> {
    return await db
      .select()
      .from(teamMemberships)
      .leftJoin(users, eq(teamMemberships.userId, users.id))
      .where(eq(teamMemberships.teamId, teamId))
      .then(rows => rows.map(row => ({
        ...row.team_memberships,
        user: row.users!
      })));
  }

  async getTeamUpdates(teamId: string): Promise<(UserUpdate & { user: User, project?: Project })[]> {
    return await db
      .select()
      .from(userUpdates)
      .leftJoin(users, eq(userUpdates.userId, users.id))
      .leftJoin(projects, eq(userUpdates.projectId, projects.id))
      .where(eq(userUpdates.teamId, teamId))
      .orderBy(desc(userUpdates.createdAt))
      .then(rows => rows.map(row => ({
        ...row.user_updates,
        user: row.users!,
        project: row.projects || undefined
      })));
  }

  async getTeamMetrics(teamId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalMembers: number;
    totalHours: number;
    completionRate: number;
  }> {
    // Get team projects count
    const teamProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.teamId, teamId));

    // Get team members count
    const teamMembers = await db
      .select()
      .from(teamMemberships)
      .where(and(
        eq(teamMemberships.teamId, teamId),
        eq(teamMemberships.status, "ACTIVE")
      ));

    // Get total hours from user updates (using task hours)
    const teamUpdatesResult = await db
      .select({ totalHours: sql<number>`COALESCE(COUNT(${userUpdates.id}), 0)` })
      .from(userUpdates)
      .where(eq(userUpdates.teamId, teamId));

    const totalProjects = teamProjects.length;
    const activeProjects = teamProjects.filter(p => p.status === "active").length;
    const completedProjects = teamProjects.filter(p => p.status === "completed").length;
    const totalMembers = teamMembers.length;
    const totalHours = teamUpdatesResult[0]?.totalHours || 0;
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalMembers,
      totalHours,
      completionRate
    };
  }

  async createTeamMembership(userId: string, teamId: string): Promise<TeamMembership> {
    const [membership] = await db
      .insert(teamMemberships)
      .values({
        userId,
        teamId,
        status: "PENDING"
      })
      .returning();
    return membership;
  }

  // User update methods
  async getUserUpdates(userId: string): Promise<UserUpdate[]> {
    return await db
      .select()
      .from(userUpdates)
      .where(eq(userUpdates.userId, userId))
      .orderBy(desc(userUpdates.createdAt));
  }

  async createUserUpdate(userId: string, update: InsertUserUpdate): Promise<UserUpdate> {
    // Auto-generate ticket number if not provided
    const ticketNumber = update.ticketNumber || `TASK-${Date.now().toString().slice(-6)}`;
    
    const [newUpdate] = await db
      .insert(userUpdates)
      .values({ ...update, ticketNumber, userId })
      .returning();
    return newUpdate;
  }

  async updateUserUpdate(updateId: string, updates: Partial<InsertUserUpdate>): Promise<UserUpdate> {
    const [updatedUpdate] = await db
      .update(userUpdates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userUpdates.id, updateId))
      .returning();
    return updatedUpdate;
  }

  // Admin dashboard methods
  async getAdminMetrics(): Promise<{
    totalUsers: number;
    totalTeams: number;
    totalProjects: number;
    activeUsers: number;
    pendingUsers: number;
    completedTasks: number;
    taskCompletionRate: number;
    projectCompletionRate: number;
  }> {
    const usersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const teamsResult = await db.select({ count: sql<number>`count(*)` }).from(teams);
    const projectsResult = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const tasksResult = await db.select({ count: sql<number>`count(*)` }).from(tasks);
    const completedTasksResult = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "COMPLETED"));
    const completedProjectsResult = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, "completed"));

    const totalTasks = tasksResult[0]?.count || 0;
    const completedTasks = completedTasksResult[0]?.count || 0;
    const totalProjects = projectsResult[0]?.count || 0;
    const completedProjects = completedProjectsResult[0]?.count || 0;

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const projectCompletionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    const activeUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, "APPROVED"));
    const pendingUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.status, "PENDING"));

    return {
      totalUsers: usersResult[0]?.count || 0,
      totalTeams: teamsResult[0]?.count || 0,
      totalProjects: totalProjects,
      activeUsers: activeUsersResult[0]?.count || 0,
      pendingUsers: pendingUsersResult[0]?.count || 0,
      completedTasks,
      taskCompletionRate,
      projectCompletionRate,
    };
  }

  async getAllProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
  }

  async getRecentUpdates(): Promise<(UserUpdate & { user: User; team?: Team })[]> {
    const results = await db
      .select({
        update: userUpdates,
        user: users,
        team: teams
      })
      .from(userUpdates)
      .leftJoin(users, eq(userUpdates.userId, users.id))
      .leftJoin(teams, eq(userUpdates.teamId, teams.id))
      .orderBy(desc(userUpdates.createdAt))
      .limit(10);

    return results.map(result => ({
      ...result.update,
      user: result.user!,
      team: result.team || undefined
    }));
  }

  // User dashboard methods
  async getUserMetrics(userId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    totalHours: number;
    todayHours: number;
    completionRate: number;
    averageTaskTime: number;
  }> {
    const userTasksResult = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    const totalTasks = userTasksResult.length;
    const completedTasks = userTasksResult.filter(t => t.status === "COMPLETED").length;
    const inProgressTasks = userTasksResult.filter(t => t.status === "IN_PROGRESS").length;
    const blockedTasks = userTasksResult.filter(t => t.status === "BLOCKED").length;
    
    const totalHours = userTasksResult.reduce((sum, task) => sum + (task.actualHours || 0), 0);
    const todayHours = userTasksResult
      .filter(task => {
        const today = new Date().toISOString().split('T')[0];
        const taskDate = task.updatedAt?.toISOString().split('T')[0];
        return taskDate === today;
      })
      .reduce((sum, task) => sum + (task.actualHours || 0), 0);
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const averageTaskTime = completedTasks > 0 ? Math.round(totalHours / completedTasks) : 0;

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
  }

  // Task methods
  async getTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(taskId: string): Promise<Task | undefined> {
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    
    return result[0] || undefined;
  }

  async createTask(userId: string, task: InsertTask): Promise<Task> {
    const result = await db
      .insert(tasks)
      .values({ ...task, userId })
      .returning();
    
    return result[0];
  }

  async updateTask(taskId: string, updates: Partial<InsertTask>): Promise<Task> {
    const result = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
    
    return result[0];
  }

  async getUserTasks(userId: string): Promise<(Task & { project?: Project })[]> {
    const results = await db
      .select({
        task: tasks,
        project: projects
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));

    return results.map(result => ({
      ...result.task,
      project: result.project || undefined
    }));
  }

  async getUserRecentTasks(userId: string): Promise<(Task & { project?: Project })[]> {
    const results = await db
      .select({
        task: tasks,
        project: projects
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.updatedAt))
      .limit(5);

    return results.map(result => ({
      ...result.task,
      project: result.project || undefined
    }));
  }

}

export const storage: IStorage = new DatabaseStorage();
