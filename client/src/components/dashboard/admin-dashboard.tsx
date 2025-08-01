import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, Briefcase, Target, Activity, Search, Filter, TrendingUp, CheckCircle } from "lucide-react";
import { DashboardHeader } from "./dashboard-header";
import type { Team, User, Project, UserUpdate } from "@shared/schema";

interface AdminMetrics {
  totalUsers: number;
  totalTeams: number;
  totalTasks: number;
  completedTasks: number;
  totalProjects: number;
  completedProjects: number;
  taskCompletionRate: number;
  projectCompletionRate: number;
}

export function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  // Color palette for teams (consistent colors)
  const teamColors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-green-100 text-green-800 border-green-200", 
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-cyan-100 text-cyan-800 border-cyan-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-red-100 text-red-800 border-red-200"
  ];

  const getTeamColor = (teamId: string) => {
    const teamIndex = teams.findIndex(team => team.id === teamId);
    return teamColors[teamIndex % teamColors.length] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const { data: metrics, isLoading: metricsLoading } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics"],
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/admin/teams"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/admin/projects"],
  });

  const { data: recentUpdates = [], isLoading: updatesLoading } = useQuery<(UserUpdate & { user: User; team?: Team })[]>({
    queryKey: ["/api/admin/recent-updates"],
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter projects based on search and filters  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === "all" || project.teamId === teamFilter;
    return matchesSearch && matchesTeam;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "ACTIVE":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
      case "active":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "REJECTED":
      case "archived":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (metricsLoading || teamsLoading || usersLoading || projectsLoading) {
    return (
      <>
        <DashboardHeader />
        <div className="p-4 lg:p-6">
          <div className="text-lg">Loading admin dashboard...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <div className="p-4 lg:p-6 space-y-6">
        {/* Admin Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{metrics?.totalUsers || 0}</p>
                  <p className="text-xs text-green-600">System users</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Teams</p>
                  <p className="text-2xl font-bold">{metrics?.totalTeams || 0}</p>
                  <p className="text-xs text-gray-600">Active teams</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold">{metrics?.totalProjects || 0}</p>
                  <p className="text-xs text-gray-600">All projects</p>
                </div>
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold">{metrics?.totalTasks || 0}</p>
                  <p className="text-xs text-gray-600">{metrics?.completedTasks || 0} completed</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Task Completion Rate</p>
                  <p className="text-2xl font-bold">{metrics?.taskCompletionRate || 0}%</p>
                  <p className="text-xs text-gray-600">Overall progress</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Project Completion Rate</p>
                  <p className="text-2xl font-bold">{metrics?.projectCompletionRate || 0}%</p>
                  <p className="text-xs text-gray-600">Overall progress</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center gap-2 p-2 rounded border">
                  <div className={`w-4 h-4 rounded-full ${getTeamColor(team.id).replace("text-", "bg-").split(" ")[0]}`}></div>
                  <span className="text-sm font-medium truncate">{team.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users, projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getTeamColor(team.id).replace("text-", "bg-").split(" ")[0]}`}></div>
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Users Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No users found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Projects Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Projects Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <h4 className="font-medium text-sm">{project.title}</h4>
                        {project.teamId && (
                          <Badge className={`text-xs ${getTeamColor(project.teamId)}`}>
                            {teams.find(t => t.id === project.teamId)?.name || 'Unknown Team'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{project.description}</p>
                    <p className="text-xs text-gray-500">
                      Team: {teams.find(t => t.id === project.teamId)?.name || 'Unknown'}
                    </p>
                    {project.dueDate && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(project.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
                {filteredProjects.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No projects found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Team Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentUpdates.map((update) => (
                <div key={update.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className="font-medium text-sm">{update.title}</h4>
                      {update.teamId && (
                        <Badge className={`text-xs ${getTeamColor(update.teamId)}`}>
                          {teams.find(t => t.id === update.teamId)?.name || 'Unknown Team'}
                        </Badge>
                      )}
                    </div>
                    <Badge className={getStatusColor(update.status)}>
                      {update.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{update.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      By: {update.user.firstName && update.user.lastName 
                        ? `${update.user.firstName} ${update.user.lastName}`
                        : update.user.email}
                    </span>
                    <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {recentUpdates.length === 0 && (
                <p className="text-center text-gray-500 py-4">No recent updates</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}