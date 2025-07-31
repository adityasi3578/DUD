import { useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { QuickUpdateForm } from "@/components/dashboard/quick-update-form";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { QuickStats } from "@/components/dashboard/quick-stats";

export default function Dashboard() {
  useEffect(() => {
    document.title = "Daily Update Dashboard - MyTools";
  }, []);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <DashboardHeader />
        <div className="p-4 lg:p-6">
          <MetricsGrid />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              <QuickUpdateForm />
              <ProgressChart />
            </div>
            <div className="space-y-4 lg:space-y-6">
              <ActivityFeed />
              <QuickStats />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
