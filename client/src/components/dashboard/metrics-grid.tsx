import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Target, Clock, Zap, TrendingUp, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface Metrics {
  tasksCompleted: number;
  tasksChange: string;
  goalProgress: number;
  timeSpent: string;
  timeSpentStatus: string;
  productivityScore: number;
  productivityChange: string;
  currentStreak: number;
}

export function MetricsGrid() {
  const { data: metrics, isLoading } = useQuery<Metrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const metricCards = [
    {
      title: "Tasks Completed",
      value: metrics.tasksCompleted.toString(),
      change: metrics.tasksChange,
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      changeColor: metrics.tasksChange.includes('+') ? "text-green-600" : "text-orange-600"
    },
    {
      title: "Daily Goal Progress",
      value: `${metrics.goalProgress}%`,
      progress: metrics.goalProgress,
      icon: Target,
      iconBg: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      title: "Time Spent",
      value: metrics.timeSpent,
      change: metrics.timeSpentStatus,
      icon: Clock,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      changeColor: "text-orange-600"
    },
    {
      title: "Productivity Score",
      value: metrics.productivityScore.toString(),
      change: metrics.productivityChange,
      icon: Zap,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      changeColor: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-slate-600 truncate">{metric.title}</p>
                  <p className="text-xl lg:text-2xl font-semibold text-slate-900">{metric.value}</p>
                  
                  {metric.progress !== undefined ? (
                    <div className="w-full">
                      <Progress value={metric.progress} className="h-2" />
                    </div>
                  ) : metric.change ? (
                    <p className={`text-xs flex items-center ${metric.changeColor}`}>
                      {metric.change.includes('+') && <ArrowUp className="w-3 h-3 mr-1" />}
                      {metric.change}
                    </p>
                  ) : null}
                </div>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 ${metric.iconBg} rounded-lg flex items-center justify-center ml-3`}>
                  <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${metric.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
