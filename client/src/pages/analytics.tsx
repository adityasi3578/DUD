import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Clock, Target, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Sidebar } from "@/components/dashboard/sidebar";

interface WeeklyStat {
  date: string;
  tasks: number;
  hours: number;
}

interface MonthlyStats {
  tasks: number;
  hours: number;
  streak: number;
}

export default function Analytics() {
  useEffect(() => {
    document.title = "Analytics - MyTools";
  }, []);

  const { data: weeklyStats, isLoading: isLoadingWeekly } = useQuery<WeeklyStat[]>({
    queryKey: ["/api/analytics/weekly"],
  });

  const { data: monthlyStats, isLoading: isLoadingMonthly } = useQuery<MonthlyStats>({
    queryKey: ["/api/analytics/monthly"],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const chartData = weeklyStats?.map(stat => ({
    ...stat,
    dayName: formatDate(stat.date),
    fullDate: stat.date
  })) || [];

  // Generate productivity distribution data
  const productivityData = [
    { name: 'High Productivity', value: 35, color: '#10b981' },
    { name: 'Medium Productivity', value: 45, color: '#3b82f6' },
    { name: 'Low Productivity', value: 20, color: '#f59e0b' }
  ];

  const isLoading = isLoadingWeekly || isLoadingMonthly;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Detailed insights into your productivity patterns
            </p>
          </div>
          <Select defaultValue="thisMonth">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Tasks</p>
                      <p className="text-2xl font-bold">{monthlyStats?.tasks || 0}</p>
                      <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Hours</p>
                      <p className="text-2xl font-bold">{monthlyStats?.hours || 0}h</p>
                      <p className="text-xs text-green-600 mt-1">+8% from last month</p>
                    </div>
                    <Clock className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Streak</p>
                      <p className="text-2xl font-bold">{monthlyStats?.streak || 0} days</p>
                      <p className="text-xs text-blue-600 mt-1">Personal best: 23 days</p>
                    </div>
                    <Award className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg per Day</p>
                      <p className="text-2xl font-bold">{monthlyStats?.tasks ? Math.round(monthlyStats.tasks / 30) : 0}</p>
                      <p className="text-xs text-purple-600 mt-1">Tasks completed</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Tasks Completed</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="dayName" 
                        axisLine={false}
                        tickLine={false}
                        className="text-xs"
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        className="text-xs"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [value, 'Tasks Completed']}
                      />
                      <Bar 
                        dataKey="tasks" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Hours Worked Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="dayName" 
                        axisLine={false}
                        tickLine={false}
                        className="text-xs"
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        className="text-xs"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [`${value}h`, 'Hours Worked']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Productivity Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Productivity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productivityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Percentage']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {productivityData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-200">Best Day</h4>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                      {chartData.length > 0 
                        ? `${chartData.reduce((max, day) => day.tasks > max.tasks ? day : max, chartData[0]).dayName} - ${chartData.reduce((max, day) => day.tasks > max.tasks ? day : max, chartData[0]).tasks} tasks`
                        : 'No data yet'
                      }
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Most Productive Time</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">Weekdays: 9-11 AM</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Recommendations</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Your productivity peaks in the morning. Schedule important tasks between 9-11 AM.
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Consider taking breaks every 2 hours to maintain consistent performance.
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Your current streak is {monthlyStats?.streak || 0} days. Keep it up!
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}