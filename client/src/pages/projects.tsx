import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, AlertCircle, CheckCircle, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project, InsertProject, Team, TeamMembership } from "@shared/schema";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function Projects() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState<Omit<InsertProject, 'userId'>>({
    title: "",
    teamId: "",
    description: "",
    status: "active",
    priority: "medium",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch user's teams for project creation
  const { data: userTeams = [] } = useQuery<(TeamMembership & { team: Team })[]>({
    queryKey: ["/api/user/teams"],
  });

  const createProjectMutation = useMutation({
    mutationFn: (project: Omit<InsertProject, 'userId'>) => apiRequest("/api/projects", "POST", project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowCreateForm(false);
      setNewProject({
        title: "",
        teamId: "",
        description: "",
        status: "active",
        priority: "medium",
      });
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<InsertProject, 'userId'>> }) =>
      apiRequest(`/api/projects/${id}`, "PUT", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });



  const handleCreateProject = () => {
    if (newProject.title.trim() && newProject.teamId.trim()) {
      createProjectMutation.mutate(newProject);
    } else {
      toast({
        title: "Missing Information",
        description: "Please provide both title and team",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = (projectId: string, status: string) => {
    updateProjectMutation.mutate({ id: projectId, updates: { status } });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <Clock className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="text-lg">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 space-y-4 lg:space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Projects</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 lg:mt-2 text-sm lg:text-base">
              Manage your projects and track progress
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="w-full lg:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Input
                placeholder="Project title"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                data-testid="input-project-title"
              />
              <Input
                placeholder="Ticket Number (optional, e.g., PROJ-123)"
                value={newProject.ticketNumber || ""}
                onChange={(e) => setNewProject({ ...newProject, ticketNumber: e.target.value })}
                data-testid="input-project-ticket"
              />
            </div>
            <Select
              value={newProject.teamId}
              onValueChange={(teamId) => setNewProject({ ...newProject, teamId })}
            >
              <SelectTrigger data-testid="select-team">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {userTeams.map((membership) => (
                  <SelectItem key={membership.team?.id} value={membership.team?.id || ""}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {membership.team?.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Project description"
              value={newProject.description || ""}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              data-testid="textarea-project-description"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={newProject.priority || "medium"}
                onValueChange={(priority) => setNewProject({ ...newProject, priority })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newProject.status || "active"}
                onValueChange={(status) => setNewProject({ ...newProject, status })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateProject} 
                disabled={createProjectMutation.isPending}
                data-testid="button-create-project"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {getPriorityIcon(project.priority)}
                <div>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  {project.ticketNumber && (
                    <p className="text-sm text-gray-500">#{project.ticketNumber}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                <Select
                  value={project.status}
                  onValueChange={(status) => handleStatusChange(project.id, status)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {project.description || "No description provided"}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>Priority: {project.priority}</span>
                <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create your first project to start tracking progress
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}