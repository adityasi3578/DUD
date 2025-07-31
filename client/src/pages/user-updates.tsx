import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Clock, Calendar, User, Hash, FolderOpen, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { insertUserUpdateSchema, type UserUpdate, type Team, type Project } from "@shared/schema";
import { z } from "zod";

const createUpdateSchema = insertUserUpdateSchema.extend({
  workHours: z.number().min(0).max(24),
});

type CreateUpdateData = z.infer<typeof createUpdateSchema>;

export default function UserUpdates() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "My Updates - MyTools";
  }, []);

  // Get user's updates
  const { data: updates = [], isLoading: updatesLoading } = useQuery<UserUpdate[]>({
    queryKey: ["/api/user-updates"],
  });

  // Get user's teams for the dropdown
  const { data: userTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/user/teams"],
  });

  // Get projects for selected team
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const { data: teamProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/teams", selectedTeamId, "projects"],
    enabled: !!selectedTeamId,
  });

  const form = useForm<CreateUpdateData>({
    resolver: zodResolver(createUpdateSchema),
    defaultValues: {
      title: "",
      description: "",
      ticketNumber: "",
      workHours: 0,
      status: "IN_PROGRESS",
      priority: "MEDIUM",
    },
  });

  const createUpdateMutation = useMutation({
    mutationFn: (data: CreateUpdateData) => 
      apiRequest("/api/user-updates", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-updates"] });
      setShowCreateForm(false);
      form.reset();
      toast({
        title: "Success",
        description: "Update created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create update",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUpdateData) => {
    createUpdateMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "BLOCKED": return "bg-red-100 text-red-800";
      case "REVIEW": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-100 text-red-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "MEDIUM": return "bg-blue-100 text-blue-800";
      case "LOW": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 space-y-4 lg:space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">My Work Updates</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 lg:mt-2 text-sm lg:text-base">
              Track your daily work progress and share updates with your team
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="w-full lg:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Update
          </Button>
        </div>

        {/* Create Update Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Update</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief update title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ticketNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., JIRA-123" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="teamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedTeamId(value);
                          }}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select team" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {userTeams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} disabled={!selectedTeamId}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teamProjects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hours Worked</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="24" 
                              step="0.5"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="BLOCKED">Blocked</SelectItem>
                              <SelectItem value="REVIEW">Under Review</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what you worked on, any blockers, next steps..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col lg:flex-row justify-end space-y-2 lg:space-y-0 lg:space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                      className="w-full lg:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createUpdateMutation.isPending}
                      className="w-full lg:w-auto"
                    >
                      {createUpdateMutation.isPending ? "Creating..." : "Create Update"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Updates List */}
        <div className="space-y-4">
          {updatesLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">Loading updates...</div>
              </CardContent>
            </Card>
          ) : updates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No updates yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Start tracking your work by creating your first update
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Update
                </Button>
              </CardContent>
            </Card>
          ) : (
            updates.map((update) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{update.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                        </div>
                        {(update.workHours || 0) > 0 && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{update.workHours || 0}h</span>
                          </div>
                        )}
                        {update.ticketNumber && (
                          <div className="flex items-center space-x-1">
                            <Hash className="h-4 w-4" />
                            <span>{update.ticketNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getStatusColor(update.status)}>
                        {update.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(update.priority)}>
                        {update.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {update.description}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}