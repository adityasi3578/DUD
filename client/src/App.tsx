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
import Landing from "@/pages/landing";
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
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  const userTyped = user as User;
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
