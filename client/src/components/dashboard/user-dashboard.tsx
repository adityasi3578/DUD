import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Target, TrendingUp, Search, Filter, Briefcase } from "lucide-react";
import { DashboardHeader } from "./dashboard-header";
import { WidgetLayout } from "./widget-layout";
import { useAuth } from "@/hooks/useAuth";
import type { UserUpdate, Project, Team, TeamMembership } from "@shared/schema";

interface UserMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  totalProjects: number;
  completedProjects: number;
  taskCompletionRate: number;
  projectCompletionRate: number;
}

export function UserDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
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
    const teamIndex = userTeams.findIndex(membership => membership.team?.id === teamId);
    return teamColors[teamIndex % teamColors.length] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const { data: metrics, isLoading: metricsLoading } = useQuery<UserMetrics>({
    queryKey: ["/api/user/metrics"],
  });

  const { data: userTeams = [] } = useQuery<(TeamMembership & { team: Team })[]>({
    queryKey: ["/api/user/teams"],
  });

  const { data: userTasks = [], isLoading: tasksLoading } = useQuery<(UserUpdate & { project?: Project })[]>({
    queryKey: ["/api/user/tasks"],
  });

  const { data: recentTasks = [], isLoading: recentLoading } = useQuery<(UserUpdate & { project?: Project })[]>({
    queryKey: ["/api/user/recent-tasks"],
  });

  // Filter tasks based on search and filters
  const filteredTasks = userTasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesTeam = teamFilter === "all" || task.teamId === teamFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesTeam;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "BLOCKED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "REVIEW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };



  if (metricsLoading || tasksLoading) {
    return (
      <>
        <DashboardHeader />
        <div className="p-4 lg:p-6">
          <div className="text-lg">Loading your dashboard...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <div className="p-4 lg:p-6 space-y-6">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || user?.email}!
          </h2>
          <p className="text-gray-600">
            Track your progress and manage your tasks efficiently.
          </p>
        </div>

        {/* Customizable Widget Layout */}
        <WidgetLayout 
          metrics={metrics}
          userTasks={filteredTasks}
          userTeams={userTeams}
          isLoading={metricsLoading || tasksLoading}
        />

        {/* Team Legend */}
        {userTeams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {userTeams.map((membership) => (
                  <div key={membership.team?.id} className="flex items-center gap-2 p-2 rounded border">
                    <div className={`w-4 h-4 rounded-full ${getTeamColor(membership.team?.id || "").replace("text-", "bg-").split(" ")[0]}`}></div>
                    <span className="text-sm font-medium truncate">{membership.team?.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Your Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search your tasks, tickets..."
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
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {userTeams.map((membership) => (
                    <SelectItem key={membership.team?.id} value={membership.team?.id || ""}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getTeamColor(membership.team?.id || "").replace("text-", "bg-").split(" ")[0]}`}></div>
                        {membership.team?.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          {task.teamId && (
                            <Badge className={`text-xs ${getTeamColor(task.teamId)}`}>
                              {userTeams.find(m => m.team?.id === task.teamId)?.team?.name || 'Unknown Team'}
                            </Badge>
                          )}
                        </div>
                        {task.ticketNumber && (
                          <p className="text-xs text-gray-500">Ticket: {task.ticketNumber}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No tasks found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {task.teamId && (
                          <Badge className={`text-xs ${getTeamColor(task.teamId)}`}>
                            {userTeams.find(m => m.team?.id === task.teamId)?.team?.name || 'Unknown Team'}
                          </Badge>
                        )}
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        {task.project ? `Project: ${task.project.title}` : 'No project'}
                      </span>
                      <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {recentTasks.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}