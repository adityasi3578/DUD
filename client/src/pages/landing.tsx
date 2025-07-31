import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Target, Clock, Users, Shield, CheckCircle } from "lucide-react";

export default function LandingPage() {
  useEffect(() => {
    document.title = "Welcome to MyTools - Daily Update Dashboard";
  }, []);

  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Analytics",
      description: "Get comprehensive insights into your daily productivity and track progress over time"
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and monitor personal and team goals with real-time progress visualization"
    },
    {
      icon: Users,
      title: "Team Collaboration", 
      description: "Collaborate with team members, share updates, and manage projects together"
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Secure access control with admin and user roles for different permission levels"
    },
    {
      icon: Clock,
      title: "Time Management",
      description: "Track work hours, monitor productivity scores, and optimize your daily schedule"
    },
    {
      icon: CheckCircle,
      title: "Task Management",
      description: "Create, update, and complete tasks with priority levels and status tracking"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
              Daily Update Dashboard
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Track your productivity, manage team updates, and achieve your goals with our comprehensive dashboard platform designed for modern teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signin">
                <Button size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Everything you need to stay productive
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Powerful features designed to help individuals and teams track progress, collaborate effectively, and achieve their goals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg lg:text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-center text-sm lg:text-base">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Ready to boost your productivity?
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already using MyTools to track their daily progress and achieve their goals.
            </p>
            <Link href="/signup">
              <Button size="lg" className="px-8 py-3 text-lg">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">MyTools</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2025 MyTools. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}