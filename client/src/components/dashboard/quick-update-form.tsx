import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDailyUpdateSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertDailyUpdateSchema.extend({
  hoursWorked: z.coerce.number().min(0).max(24),
});

type FormData = z.infer<typeof formSchema>;

const moodEmojis = [
  { value: 5, emoji: "😊", color: "text-green-500", label: "Great" },
  { value: 4, emoji: "🙂", color: "text-green-400", label: "Good" },
  { value: 3, emoji: "😐", color: "text-yellow-500", label: "Okay" },
  { value: 2, emoji: "🙁", color: "text-orange-500", label: "Poor" },
  { value: 1, emoji: "😢", color: "text-red-500", label: "Bad" },
];

export function QuickUpdateForm() {
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      tasksCompleted: 0,
      hoursWorked: 0,
      mood: 3,
      notes: "",
    },
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("/api/daily-updates", "POST", {
        ...data,
        hoursWorked: Math.round(data.hoursWorked * 60), // Convert to minutes
        mood: selectedMood,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Update Saved",
        description: "Your daily update has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/weekly"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your update. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createUpdateMutation.mutate(data);
  };

  const handleClear = () => {
    reset();
    setSelectedMood(3);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg lg:text-xl">Quick Daily Update</CardTitle>
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tasksCompleted">Tasks Completed</Label>
              <Input
                id="tasksCompleted"
                type="number"
                min="0"
                placeholder="0"
                {...register("tasksCompleted", { valueAsNumber: true })}
              />
              {errors.tasksCompleted && (
                <p className="text-sm text-red-500 mt-1">{errors.tasksCompleted.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="hoursWorked">Hours Worked</Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.5"
                min="0"
                max="24"
                placeholder="0.0"
                {...register("hoursWorked")}
              />
              {errors.hoursWorked && (
                <p className="text-sm text-red-500 mt-1">{errors.hoursWorked.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="mood" className="block text-sm font-medium text-slate-700 mb-2">
              How are you feeling?
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {moodEmojis.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-2 lg:p-3 rounded-lg border-2 transition-all text-center mobile-touch-target ${
                    selectedMood === mood.value
                      ? 'border-primary bg-primary/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg lg:text-2xl mb-1">{mood.emoji}</div>
                  <div className="text-xs text-slate-600">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="What did you accomplish today?"
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="submit" 
              className="flex-1 mobile-touch-target" 
              disabled={createUpdateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {createUpdateMutation.isPending ? "Saving..." : "Save Update"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClear} className="mobile-touch-target">
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
