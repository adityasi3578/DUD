import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import Projects from "@/pages/projects";
import AdminPanel from "@/pages/admin-panel";
import TeamDashboard from "@/pages/team-dashboard";
import SigninPage from "@/pages/signin";
import SignupPage from "@/pages/signup";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/signup" component={SignupPage} />
        <Route path="/" component={SigninPage} />
        <Route component={SigninPage} />
      </Switch>
    );
  }

  // Check if user account is approved
  const userTyped = user as User;
  if (userTyped && userTyped.status === "PENDING") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Account Pending Approval</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your account is waiting for admin approval. You'll be notified once approved.
          </p>
          <button
            onClick={async () => {
              await fetch("/api/auth/signout", { method: "POST" });
              window.location.href = "/";
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = userTyped?.role === "ADMIN";

  return (
    <Switch>
      {isAdmin ? (
        <>
          <Route path="/" component={AdminPanel} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/team-dashboard" component={TeamDashboard} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
          <Route path="/projects" component={Projects} />
        </>
      ) : (
        <>
          <Route path="/" component={TeamDashboard} />
          <Route path="/team-dashboard" component={TeamDashboard} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
          <Route path="/projects" component={Projects} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
