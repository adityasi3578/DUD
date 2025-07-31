import { BarChart3, Target, Clock, Settings, Zap, FolderOpen, Users, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { UserPanel } from "./user-panel";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const userTyped = user as User;
  const isAdmin = userTyped?.role === "ADMIN";

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">MyTools</h1>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {isAdmin ? (
            <>
              <li>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/') || isActive('/admin')
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Panel</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/team-dashboard"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/team-dashboard') 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Team Dashboard</span>
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/') || isActive('/team-dashboard')
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Team Dashboard</span>
                </Link>
              </li>
            </>
          )}
          <li>
            <Link
              href="/tasks"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/tasks') 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Target className="w-5 h-5" />
              <span>Tasks</span>
            </Link>
          </li>
          <li>
            <Link
              href="/analytics"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/analytics') 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>Analytics</span>
            </Link>
          </li>
          <li>
            <Link
              href="/projects"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/projects') 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FolderOpen className="w-5 h-5" />
              <span>Projects</span>
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/settings') 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <UserPanel />
      </div>
    </aside>
  );
}
