import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProjectUpdate, InsertProjectUpdate } from "@shared/schema";

interface ProjectUpdatesProps {
  projectId: string;
}

export function ProjectUpdates({ projectId }: ProjectUpdatesProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState<Omit<InsertProjectUpdate, 'projectId'>>({
    title: "",
    description: "",
    status: "progress",
    hoursWorked: 0,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: updates = [], isLoading } = useQuery<ProjectUpdate[]>({
    queryKey: ["/api/projects", projectId, "updates"],
    queryFn: () => apiRequest(`/api/projects/${projectId}/updates`),
  });

  const createUpdateMutation = useMutation({
    mutationFn: (update: Omit<InsertProjectUpdate, 'projectId'>) => 
      apiRequest(`/api/projects/${projectId}/updates`, "POST", { ...update, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "updates"] });
      setShowCreateForm(false);
      setNewUpdate({
        title: "",
        description: "",
        status: "progress",
        hoursWorked: 0,
      });
      toast({
        title: "Success",
        description: "Project update created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project update",
        variant: "destructive",
      });
    },
  });

  const handleCreateUpdate = () => {
    if (newUpdate.title.trim() && newUpdate.description.trim()) {
      createUpdateMutation.mutate(newUpdate);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "blocked":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "issue":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "issue":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading project updates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Project Updates</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track progress and share updates with your team
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Update
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Project Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Update title"
              value={newUpdate.title}
              onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
            />
            <Textarea
              placeholder="Describe what you've worked on..."
              value={newUpdate.description}
              onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={newUpdate.status || "progress"}
                onValueChange={(status) => setNewUpdate({ ...newUpdate, status })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Hours worked"
                value={newUpdate.hoursWorked?.toString() || ""}
                onChange={(e) => setNewUpdate({ ...newUpdate, hoursWorked: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateUpdate} disabled={createUpdateMutation.isPending}>
                {createUpdateMutation.isPending ? "Creating..." : "Add Update"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {updates.map((update) => (
          <Card key={update.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(update.status)}
                <CardTitle className="text-lg">{update.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(update.status)}>
                  {update.status}
                </Badge>
                {update.hoursWorked > 0 && (
                  <Badge variant="outline">
                    {update.hoursWorked}h
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                {update.description}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(update.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {updates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No updates yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Start tracking your project progress by adding your first update
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Update
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}