import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Settings, Trash2, Edit, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, User, TeamMembership, InsertTeam } from "@shared/schema";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function AdminPanel() {
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [newTeam, setNewTeam] = useState<Omit<InsertTeam, 'createdBy'>>({
    name: "",
    description: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/admin/teams"],
    select: (data) => {
      // Ensure we always get an array of teams
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery<(TeamMembership & { user: User; team: Team })[]>({
    queryKey: ["/api/admin/memberships"],
  });

  const createTeamMutation = useMutation({
    mutationFn: (team: Omit<InsertTeam, 'createdBy'>) => 
      apiRequest("/api/admin/teams", "POST", team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      setShowCreateTeamForm(false);
      setNewTeam({ name: "", description: "" });
      toast({
        title: "Success",
        description: "Team created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const updateMembershipStatusMutation = useMutation({
    mutationFn: ({ membershipId, status }: { membershipId: string; status: string }) =>
      apiRequest(`/api/admin/memberships/${membershipId}`, "PATCH", { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/memberships"] });
      toast({
        title: "Success",
        description: "Membership status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update membership status",
        variant: "destructive",
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest(`/api/admin/users/${userId}/role`, "PATCH", { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User role updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      apiRequest(`/api/admin/users/${userId}/status`, "PATCH", { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = () => {
    if (newTeam.name.trim()) {
      createTeamMutation.mutate(newTeam);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "USER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (teamsLoading || usersLoading || membershipsLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="text-lg">Loading admin panel...</div>
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
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage teams, users, and system settings
            </p>
          </div>
        </div>

        {/* Teams Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams Management
            </CardTitle>
            <Button onClick={() => setShowCreateTeamForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardHeader>
          <CardContent>
            {showCreateTeamForm && (
              <div className="mb-6 p-4 border rounded-lg space-y-4">
                <h3 className="font-medium">Create New Team</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    placeholder="Team name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  />
                  <Input
                    placeholder="Ticket Number (optional, e.g., TEAM-123)"
                    value={newTeam.ticketNumber || ""}
                    onChange={(e) => setNewTeam({ ...newTeam, ticketNumber: e.target.value })}
                  />
                </div>
                <Textarea
                  placeholder="Team description"
                  value={newTeam.description || ""}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>
                    {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateTeamForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {team.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Users Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.email || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      <Select
                        value={user.role}
                        onValueChange={(role) =>
                          updateUserRoleMutation.mutate({ userId: user.id, role })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">USER</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                      {user.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateUserStatusMutation.mutate({
                                userId: user.id,
                                status: "APPROVED",
                              })
                            }
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateUserStatusMutation.mutate({
                                userId: user.id,
                                status: "REJECTED",
                              })
                            }
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Memberships */}
        <Card>
          <CardHeader>
            <CardTitle>Team Membership Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberships
                .filter(membership => membership.status === "PENDING")
                .map((membership) => (
                <div key={membership.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {membership.user.firstName && membership.user.lastName 
                          ? `${membership.user.firstName} ${membership.user.lastName}`
                          : membership.user.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        wants to join <strong>{membership.team.name}</strong>
                      </p>
                      <Badge className={`${getStatusColor(membership.status)} mt-2`}>
                        {membership.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => 
                          updateMembershipStatusMutation.mutate({
                            membershipId: membership.id,
                            status: "ACTIVE"
                          })
                        }
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => 
                          updateMembershipStatusMutation.mutate({
                            membershipId: membership.id,
                            status: "INACTIVE"
                          })
                        }
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {memberships.filter(membership => membership.status === "PENDING").length === 0 && (
                <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                  No pending membership requests
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}