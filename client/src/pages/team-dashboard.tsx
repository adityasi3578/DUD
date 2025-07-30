import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, ArrowUpDown, BarChart3, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Team, TeamMembership, Project, User } from "@shared/schema";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function TeamDashboard() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [showJoinTeamForm, setShowJoinTeamForm] = useState(false);
  const [teamToJoin, setTeamToJoin] = useState<string>("");

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get user's teams
  const { data: userTeams = [], isLoading: userTeamsLoading } = useQuery<(TeamMembership & { team: Team })[]>({
    queryKey: ["/api/user/teams"],
  });

  // Get all available teams for joining
  const { data: allTeams = [], isLoading: allTeamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
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
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
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

  if (userTeamsLoading || allTeamsLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="text-lg">Loading your teams...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Team Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Collaborate with your teams and track progress
            </p>
          </div>
          <Button onClick={() => setShowJoinTeamForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Request to Join Team
          </Button>
        </div>

        {/* Team Selection */}
        {activeTeams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Switch Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {activeTeams.map((membership) => (
                    <SelectItem key={membership.teamId} value={membership.teamId}>
                      {membership.team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Join Team Form */}
        {showJoinTeamForm && (
          <Card>
            <CardHeader>
              <CardTitle>Join a Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={teamToJoin} onValueChange={setTeamToJoin}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team to join" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeamsToJoin.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} - {team.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={handleJoinTeam} disabled={joinTeamMutation.isPending}>
                  {joinTeamMutation.isPending ? "Sending Request..." : "Send Join Request"}
                </Button>
                <Button variant="outline" onClick={() => setShowJoinTeamForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Teams Message */}
        {activeTeams.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No active teams
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You're not part of any active teams yet. Request to join a team to get started.
              </p>
              <Button onClick={() => setShowJoinTeamForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Request to Join Team
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Selected Team Content */}
        {selectedTeam && (
          <>
            {/* Team Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {selectedTeam.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {selectedTeam.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{teamProjects.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Projects</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{teamMembers.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Members</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">
                      {teamProjects.filter(p => p.status === "active").length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Team Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-6">Loading projects...</div>
                ) : teamProjects.length > 0 ? (
                  <div className="space-y-4">
                    {teamProjects.map((project) => (
                      <div key={project.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{project.title}</h3>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                            <Badge className={getPriorityColor(project.priority)}>
                              {project.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {project.description}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                          {project.dueDate && (
                            <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-600 dark:text-gray-300">
                    No projects in this team yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="text-center py-6">Loading members...</div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((membership) => (
                      <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {membership.user.firstName?.[0] || membership.user.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {membership.user.firstName && membership.user.lastName 
                                ? `${membership.user.firstName} ${membership.user.lastName}`
                                : membership.user.email}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {membership.user.email}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {membership.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}