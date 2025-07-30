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
import { insertGoalSchema, type Goal } from "@shared/schema";
import { z } from "zod";

const formSchema = insertGoalSchema.extend({
  target: z.coerce.number().min(1).max(1000),
});

type FormData = z.infer<typeof formSchema>;

export default function Tasks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Tasks & Goals - MyTools";
  }, []);

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
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
      target: 1,
      type: "tasks",
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/goals", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Goal Created",
        description: "Your new goal has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createGoalMutation.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tasks":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "hours":
        return <Target className="w-5 h-5 text-green-600" />;
      case "exercise":
        return <Target className="w-5 h-5 text-orange-600" />;
      case "reading":
        return <Target className="w-5 h-5 text-purple-600" />;
      default:
        return <Target className="w-5 h-5 text-gray-600" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Tasks & Goals</h1>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <a
                href="/"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Target className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a
                href="/tasks"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Tasks & Goals</span>
              </a>
            </li>
            <li>
              <a
                href="/analytics"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Target className="w-5 h-5" />
                <span>Analytics</span>
              </a>
            </li>
            <li>
              <a
                href="/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Target className="w-5 h-5" />
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Tasks & Goals</h2>
              <p className="text-slate-600 mt-1">Manage your goals and track progress</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Goal Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Complete 50 tasks this month"
                      {...register("title")}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="type">Goal Type</Label>
                    <Select onValueChange={(value) => setValue("type", value)} defaultValue="tasks">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tasks">Tasks</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="exercise">Exercise</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="target">Target</Label>
                    <Input
                      id="target"
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="50"
                      {...register("target")}
                    />
                    {errors.target && (
                      <p className="text-sm text-red-500 mt-1">{errors.target.message}</p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={createGoalMutation.isPending}
                    >
                      {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
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
            ) : goals && goals.length > 0 ? (
              goals.map((goal) => {
                const progressPercentage = Math.round((goal.current / goal.target) * 100);
                
                return (
                  <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(goal.type)}
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
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
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-slate-900">
                            {goal.current}
                          </span>
                          <span className="text-sm text-slate-500">
                            of {goal.target} {goal.type}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(progressPercentage)}`}
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500">
                          Created {new Date(goal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No goals yet</h3>
                <p className="text-slate-500 mb-4">Create your first goal to start tracking progress</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Goal
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}