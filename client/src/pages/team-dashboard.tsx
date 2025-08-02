import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, ArrowUpDown, BarChart3, Clock, Filter, Eye, TrendingUp, UserCheck, Calendar, Target, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Team, TeamMembership, Project, User, UserUpdate } from "@shared/schema";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function TeamDashboard() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [showJoinTeamForm, setShowJoinTeamForm] = useState(false);
  const [teamToJoin, setTeamToJoin] = useState<string>("");
  const [currentView, setCurrentView] = useState<"list" | "details">("list");
  
  // Filters for team progress view
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if user is admin
  const isAdmin = user && 'role' in user && user.role === "ADMIN";

  useEffect(() => {
    document.title = "Team Dashboard - MyTools";
  }, []);

  // Get user's teams (different structure for admins vs users)
  const { data: userTeams = [], isLoading: userTeamsLoading } = useQuery<(TeamMembership & { team: Team })[]>({
    queryKey: isAdmin ? ["/api/admin/teams"] : ["/api/user/teams"],
    select: (data: any) => {
      console.log("Raw user teams data:", data);
      // Handle both admin and user team response formats
      if (!Array.isArray(data)) return [];
      
      if (isAdmin) {
        // Admin gets teams directly, wrap them as memberships
        return data.map(team => ({
          id: `admin-${team.id}`,
          userId: user?.id || "",
          teamId: team.id,
          role: "LEAD" as const,
          status: "ACTIVE" as const,
          joinedAt: team.createdAt,
          team: team
        }));
      } else {
        // Regular users get membership objects with nested team
        return data;
      }
    },
  });

  // Get all available teams for joining (users only)
  const { data: allTeams = [], isLoading: allTeamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: !isAdmin,
  });

  // Get selected team's projects
  const { data: teamProjects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/teams", selectedTeamId, "projects"],
    enabled: !!selectedTeamId,
  });

  // Get selected team's members
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<(TeamMembership & { user: User })[]>({
    queryKey: ["/api/teams", selectedTeamId, "members"],
    enabled: !!selectedTeamId,
  });

  // Get team updates (user progress within team)
  const { data: teamUpdates = [], isLoading: updatesLoading, error: updatesError } = useQuery<(UserUpdate & { user: User, project?: Project })[]>({
    queryKey: ["/api/teams", selectedTeamId, "updates"],
    enabled: !!selectedTeamId,
    retry: false,
    select: (data) => {
      // Handle empty or error responses gracefully
      return Array.isArray(data) ? data : [];
    },
  });

  // Get team metrics
  const { data: teamMetrics, isLoading: metricsLoading } = useQuery<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalMembers: number;
    totalHours: number;
    completionRate: number;
  }>({
    queryKey: ["/api/teams", selectedTeamId, "metrics"],
    enabled: !!selectedTeamId,
  });

  // Set initial team selection
  useEffect(() => {
    if (userTeams.length > 0 && !selectedTeamId) {
      const activeTeam = userTeams.find(t => t.status === "ACTIVE");
      if (activeTeam) {
        setSelectedTeamId(activeTeam.teamId);
      }
    }
  }, [userTeams, selectedTeamId]);

  const joinTeamMutation = useMutation({
    mutationFn: (teamId: string) => 
      apiRequest("/api/user/join-team", "POST", { teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/teams"] });
      setShowJoinTeamForm(false);
      setTeamToJoin("");
      toast({
        title: "Success",
        description: "Team join request sent! Waiting for admin approval.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive",
      });
    },
  });

  const handleJoinTeam = () => {
    if (teamToJoin) {
      joinTeamMutation.mutate(teamToJoin);
    }
  };

  const selectedTeam = userTeams.find(t => t.teamId === selectedTeamId)?.team;
  const activeTeams = userTeams.filter(t => t.status === "ACTIVE");
  const availableTeamsToJoin = allTeams.filter(team => 
    !userTeams.some(userTeam => userTeam.teamId === team.id)
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "in_progress":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
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

  // Filter team updates based on selected filters
  const filteredUpdates = teamUpdates.filter(update => {
    if (selectedUser !== "all" && update.userId !== selectedUser) return false;
    if (selectedProject !== "all" && update.projectId !== selectedProject) return false;
    if (selectedStatus !== "all" && update.status !== selectedStatus) return false;
    return true;
  });

  if (userTeamsLoading || allTeamsLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 p-4 lg:p-6">
          <div className="text-lg">Loading your teams...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {currentView === "list" ? (
          // Team List View
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Team Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {isAdmin ? "Manage and monitor all teams" : "Collaborate with your teams and track progress"}
                </p>
              </div>
              {!isAdmin && (
                <Button onClick={() => setShowJoinTeamForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Join Team
                </Button>
              )}
            </div>

            {/* Debug Info */}
            {import.meta.env.DEV && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
                <p><strong>Debug Info:</strong></p>
                <p>User Teams Count: {userTeams.length}</p>
                <p>Active Teams Count: {activeTeams.length}</p>
                <p>User Role: {user && 'role' in user ? user.role : 'Unknown'}</p>
                <p>Selected Team ID: {selectedTeamId}</p>
              </div>
            )}

            {/* Teams Grid */}
            {activeTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {activeTeams.map((membership) => (
                  <Card key={membership.teamId} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {membership.team?.name || "Unknown Team"}
                        </CardTitle>
                        <Badge variant={membership.role === "LEAD" ? "default" : "secondary"}>
                          {membership.role || "MEMBER"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {membership.team?.description || "No description"}
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedTeamId(membership.teamId);
                          setCurrentView("details");
                        }}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Progress
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No active teams
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {isAdmin 
                      ? "Create teams from the admin panel to get started."
                      : "You're not part of any active teams yet. Request to join a team to get started."
                    }
                  </p>
                  {!isAdmin && (
                    <Button onClick={() => setShowJoinTeamForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request to Join Team
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Join Team Dialog */}
            <Dialog open={showJoinTeamForm} onOpenChange={setShowJoinTeamForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={teamToJoin} onValueChange={setTeamToJoin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team to join" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeamsToJoin.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-gray-500">{team.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button onClick={handleJoinTeam} disabled={joinTeamMutation.isPending || !teamToJoin}>
                      {joinTeamMutation.isPending ? "Sending..." : "Send Request"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowJoinTeamForm(false);
                      setTeamToJoin("");
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          // Team Details/Progress View
          selectedTeam && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentView("list")}
                    className="mb-2 -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Teams
                  </Button>
                  <h2 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 lg:h-8 lg:w-8" />
                    {selectedTeam.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {selectedTeam.description || "Team progress dashboard"}
                  </p>
                </div>
              </div>

              {/* Team Metrics */}
              {teamMetrics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Projects</p>
                          <p className="text-xl lg:text-2xl font-bold">{teamMetrics.totalProjects}</p>
                        </div>
                        <Target className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Active</p>
                          <p className="text-xl lg:text-2xl font-bold text-green-600">{teamMetrics.activeProjects}</p>
                        </div>
                        <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Members</p>
                          <p className="text-xl lg:text-2xl font-bold">{teamMetrics.totalMembers}</p>
                        </div>
                        <UserCheck className="h-6 w-6 lg:h-8 lg:w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Hours</p>
                          <p className="text-xl lg:text-2xl font-bold">{Math.round(teamMetrics.totalHours / 60)}h</p>
                        </div>
                        <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">User</label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.userId} value={member.userId}>
                              {member.user.firstName} {member.user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Project</label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Projects</SelectItem>
                          {teamProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Status</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="BLOCKED">Blocked</SelectItem>
                          <SelectItem value="REVIEW">Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Progress Tabs */}
              <Tabs defaultValue="updates" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="updates">Updates ({filteredUpdates.length})</TabsTrigger>
                  <TabsTrigger value="projects">Projects ({teamProjects.length})</TabsTrigger>
                  <TabsTrigger value="members">Members ({teamMembers.length})</TabsTrigger>
                </TabsList>

                {/* Updates Tab */}
                <TabsContent value="updates" className="space-y-4">
                  {filteredUpdates.length > 0 ? (
                    <div className="space-y-4">
                      {filteredUpdates.map((update) => (
                        <Card key={update.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm lg:text-base">{update.title}</h4>
                              <div className="flex gap-2 ml-4">
                                <Badge className={getStatusColor(update.status)}>
                                  {update.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className={getPriorityColor(update.priority)}>
                                  {update.priority}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{update.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                {update.user.firstName} {update.user.lastName}
                              </span>
                              {update.project && (
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {update.project.title}
                                </span>
                              )}
                              {/* Removed workHours display as updates don't include hours */}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(update.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No updates found with current filters</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-4">
                  {teamProjects.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {teamProjects
                        .filter(project => selectedProject === "all" || project.id === selectedProject)
                        .map((project) => (
                          <Card key={project.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-lg">{project.title}</CardTitle>
                                <div className="flex gap-2 ml-4">
                                  <Badge className={getStatusColor(project.status)}>
                                    {project.status}
                                  </Badge>
                                  <Badge variant="outline" className={getPriorityColor(project.priority)}>
                                    {project.priority}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                {project.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due: {new Date(project.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No projects found for this team</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="space-y-4">
                  {teamMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamMembers
                        .filter(member => selectedUser === "all" || member.userId === selectedUser)
                        .map((member) => (
                          <Card key={member.userId}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {member.user.firstName[0]}{member.user.lastName[0]}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold truncate">
                                    {member.user.firstName} {member.user.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-600 truncate">{member.user.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={member.role === "LEAD" ? "default" : "secondary"}>
                                      {member.role}
                                    </Badge>
                                    <Badge variant="outline">
                                      {member.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No members found for this team</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )
        )}
      </div>
    </div>
  );
}