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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="w-12 h-12 rounded-lg" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricCards.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{metric.value}</p>
                
                {metric.progress !== undefined ? (
                  <div className="w-full mt-2">
                    <Progress value={metric.progress} className="h-2" />
                  </div>
                ) : metric.change ? (
                  <p className={`text-xs mt-1 flex items-center ${metric.changeColor}`}>
                    {metric.change.includes('+') && <ArrowUp className="w-3 h-3 mr-1" />}
                    <Clock className="w-3 h-3 mr-1" />
                    {metric.change}
                  </p>
                ) : null}
              </div>
              <div className={`w-12 h-12 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
                <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
