import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Plus, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Activity } from "@shared/schema";

const activityIcons = {
  task_completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  goal_added: { icon: Plus, color: "text-blue-600", bg: "bg-blue-100" },
  time_updated: { icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
  goal_reached: { icon: Star, color: "text-purple-600", bg: "bg-purple-100" },
};

export function ActivityFeed() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => {
              const iconConfig = activityIcons[activity.type as keyof typeof activityIcons] || activityIcons.task_completed;
              const IconComponent = iconConfig.icon;
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 ${iconConfig.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${iconConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-500">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No recent activity</p>
            </div>
          )}
        </div>
        {activities && activities.length > 0 && (
          <Button variant="ghost" className="w-full mt-4">
            View All Activity
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
