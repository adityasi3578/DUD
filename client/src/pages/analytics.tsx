import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Clock, Target, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

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
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <a
                href="/"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a
                href="/tasks"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Target className="w-5 h-5" />
                <span>Tasks & Goals</span>
              </a>
            </li>
            <li>
              <a
                href="/analytics"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium"
              >
                <TrendingUp className="w-5 h-5" />
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
              <h2 className="text-2xl font-semibold text-slate-900">Analytics Dashboard</h2>
              <p className="text-slate-600 mt-1">Detailed insights into your productivity patterns</p>
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
        </header>

        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                        <p className="text-sm font-medium text-slate-600">Total Tasks</p>
                        <p className="text-2xl font-bold text-slate-900">{monthlyStats?.tasks || 0}</p>
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
                        <p className="text-sm font-medium text-slate-600">Total Hours</p>
                        <p className="text-2xl font-bold text-slate-900">{monthlyStats?.hours || 0}h</p>
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
                        <p className="text-sm font-medium text-slate-600">Current Streak</p>
                        <p className="text-2xl font-bold text-slate-900">{monthlyStats?.streak || 0}</p>
                        <p className="text-xs text-orange-600 mt-1">days in a row</p>
                      </div>
                      <Award className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Avg Daily Tasks</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {monthlyStats?.tasks ? Math.round(monthlyStats.tasks / 30 * 10) / 10 : 0}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">tasks per day</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Weekly Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Task Progress</CardTitle>
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
                          formatter={(value) => [`${value} tasks`, 'Tasks Completed']}
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

            {/* Hours Trend Chart */}
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
                        <span className="text-sm text-slate-600">{item.name}</span>
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
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800">Best Day</h4>
                      <p className="text-sm text-green-600 mt-1">
                        {chartData.length > 0 
                          ? `${chartData.reduce((max, day) => day.tasks > max.tasks ? day : max, chartData[0]).dayName} - ${chartData.reduce((max, day) => day.tasks > max.tasks ? day : max, chartData[0]).tasks} tasks`
                          : 'No data yet'
                        }
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800">Most Productive Time</h4>
                      <p className="text-sm text-blue-600 mt-1">Weekdays: 9-11 AM</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-800">Recommendations</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <span className="text-sm text-slate-600">
                          Your productivity peaks in the morning. Schedule important tasks between 9-11 AM.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span className="text-sm text-slate-600">
                          Consider taking breaks every 2 hours to maintain consistent performance.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <span className="text-sm text-slate-600">
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
      </main>
    </div>
  );
}