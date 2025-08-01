import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "../components/dashboard/admin-dashboard";
import { UserDashboard } from "../components/dashboard/user-dashboard";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    document.title = "Dashboard - MyTools";
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-lg text-red-600">Please sign in to access dashboard</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {user.role === "ADMIN" ? <AdminDashboard /> : <UserDashboard />}
      </main>
    </div>
  );
}
