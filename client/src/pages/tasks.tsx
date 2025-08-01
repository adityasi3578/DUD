import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, Target, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTaskSchema, type Task, type Team, type TeamMembership } from "@shared/schema";
import { z } from "zod";
import { Sidebar } from "@/components/dashboard/sidebar";

const formSchema = insertTaskSchema;

type FormData = z.infer<typeof formSchema>;

export default function Tasks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Tasks & Goals - MyTools";
  }, []);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Get user's teams for task creation
  const { data: userTeams = [] } = useQuery<(TeamMembership & { team: Team })[]>({
    queryKey: ["/api/user/teams"],
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      ticketNumber: null,
      estimatedHours: 0,
      status: "TODO",
      priority: "MEDIUM",
      teamId: null,
      projectId: null,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Submitting task data:", data);
      const response = await apiRequest("/api/tasks", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Created",
        description: "Your new task has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      reset();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Task creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest(`/api/tasks/${taskId}`, "PATCH", { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Updated",
        description: "Task status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: (error: any) => {
      console.error("Task update error:", error);
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", errors);
    
    // Clean up the data - convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      projectId: data.projectId?.trim() || null,
      teamId: data.teamId?.trim() || null,
      ticketNumber: data.ticketNumber?.trim() || null,
    };
    
    console.log("Cleaned data:", cleanedData);
    createTaskMutation.mutate(cleanedData);
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
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 pt-16 lg:pt-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-xl lg:text-2xl font-semibold text-slate-900">Tasks</h2>
              <p className="text-slate-600 mt-1 text-sm lg:text-base">Manage your tasks and track progress</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 w-full lg:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Implement user authentication"
                      {...register("title")}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Task description"
                      {...register("description")}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="teamId">Team</Label>
                    <Select onValueChange={(value) => setValue("teamId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {userTeams.map((teamMembership) => (
                          <SelectItem key={teamMembership.team.id} value={teamMembership.team.id}>
                            {teamMembership.team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.teamId && (
                      <p className="text-sm text-red-500 mt-1">{errors.teamId.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ticketNumber">Ticket Number</Label>
                    <Input
                      id="ticketNumber"
                      placeholder="e.g., TASK-001"
                      {...register("ticketNumber")}
                    />
                    {errors.ticketNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.ticketNumber.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select onValueChange={(value) => setValue("priority", value as any)} defaultValue="MEDIUM">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select onValueChange={(value) => setValue("status", value as any)} defaultValue="TODO">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="BLOCKED">Blocked</SelectItem>
                          <SelectItem value="REVIEW">Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
                      placeholder="8"
                      {...register("estimatedHours")}
                    />
                    {errors.estimatedHours && (
                      <p className="text-sm text-red-500 mt-1">{errors.estimatedHours.message}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={createTaskMutation.isPending}
                    >
                      {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-8 bg-slate-200 rounded mb-4"></div>
                    <div className="h-2 bg-slate-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : tasks && tasks.length > 0 ? (
              tasks.map((task) => {
                
                return (
                  <Card key={task.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-slate-600">{task.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Status:</span>
                          <Select 
                            value={task.status} 
                            onValueChange={(newStatus) => 
                              updateTaskStatusMutation.mutate({ taskId: task.id, status: newStatus })
                            }
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TODO">To Do</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="BLOCKED">Blocked</SelectItem>
                              <SelectItem value="REVIEW">Review</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Priority:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>

                        {task.ticketNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Ticket:</span>
                            <span className="text-sm text-slate-600">{task.ticketNumber}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Actual Hours:</span>
                          <span className="text-sm text-slate-600">{task.actualHours || 0}h</span>
                        </div>

                        <div className="text-xs text-slate-500">
                          Created: {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks yet</h3>
                <p className="text-slate-600 mb-4">Create your first task to get started with tracking your work.</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}