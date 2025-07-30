import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Goal } from "@shared/schema";

interface MonthlyStats {
  tasks: number;
  hours: number;
  streak: number;
}

export function QuickStats() {
  const { data: monthlyStats, isLoading: isLoadingMonthly } = useQuery<MonthlyStats>({
    queryKey: ["/api/analytics/monthly"],
  });

  const { data: goals, isLoading: isLoadingGoals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const isLoading = isLoadingMonthly || isLoadingGoals;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Goals Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">This Week</span>
            <span className="text-sm font-medium text-slate-900">
              {Math.round((monthlyStats?.tasks || 0) / 4)} tasks
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">This Month</span>
            <span className="text-sm font-medium text-slate-900">
              {monthlyStats?.tasks || 0} tasks
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Best Streak</span>
            <span className="text-sm font-medium text-slate-900">12 days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Current Streak</span>
            <span className="text-sm font-medium text-green-600">
              {monthlyStats?.streak || 0} days
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals && goals.length > 0 ? (
            goals.map((goal) => {
              const progressPercentage = Math.round((goal.current / goal.target) * 100);
              
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{goal.title}</span>
                    <span className="text-xs text-slate-500">
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500">No goals set</p>
              <p className="text-xs text-slate-400 mt-1">Create goals to track your progress</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
