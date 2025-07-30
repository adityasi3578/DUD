import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Settings as SettingsIcon, User, Bell, Shield, Download, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SettingsFormData {
  name: string;
  email: string;
  timezone: string;
  notifications: {
    email: boolean;
    dailyReminder: boolean;
    goalAlerts: boolean;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
  };
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Settings - MyTools";
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    defaultValues: {
      name: "John Doe",
      email: "john@example.com",
      timezone: "America/New_York",
      notifications: {
        email: true,
        dailyReminder: true,
        goalAlerts: false,
      },
      privacy: {
        dataCollection: true,
        analytics: true,
      },
    },
  });

  const notifications = watch("notifications");
  const privacy = watch("privacy");

  const onSubmit = (data: SettingsFormData) => {
    // In a real app, this would save to the backend
    console.log("Settings saved:", data);
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleExport = async () => {
    try {
      const response = await apiRequest("GET", "/api/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'daily-updates-export.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllData = () => {
    if (confirm("Are you sure you want to delete all your data? This action cannot be undone.")) {
      toast({
        title: "Data Deletion",
        description: "This feature is not available in demo mode.",
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "data", label: "Data", icon: Download },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <a
                href="/"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a
                href="/tasks"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Tasks & Goals</span>
              </a>
            </li>
            <li>
              <a
                href="/analytics"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Analytics</span>
              </a>
            </li>
            <li>
              <a
                href="/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium"
              >
                <SettingsIcon className="w-5 h-5" />
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
              <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
              <p className="text-slate-600 mt-1">Manage your account preferences and data</p>
            </div>
            {isDirty && (
              <Button onClick={handleSubmit(onSubmit)} className="bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </header>

        <div className="flex">
          {/* Settings Tabs */}
          <div className="w-64 bg-white border-r border-slate-200 min-h-full">
            <nav className="p-4">
              <ul className="space-y-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                          activeTab === tab.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Profile Settings */}
              {activeTab === "profile" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          {...register("name", { required: "Name is required" })}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email", { required: "Email is required" })}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        onValueChange={(value) => setValue("timezone", value)} 
                        defaultValue="America/New_York"
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Account Actions</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">
                          Change Password
                        </Button>
                        <Button variant="outline" size="sm">
                          Two-Factor Authentication
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Settings */}
              {activeTab === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-slate-500">Receive updates via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.email}
                        onCheckedChange={(checked) => setValue("notifications.email", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="daily-reminder">Daily Reminder</Label>
                        <p className="text-sm text-slate-500">Get reminded to log your daily updates</p>
                      </div>
                      <Switch
                        id="daily-reminder"
                        checked={notifications.dailyReminder}
                        onCheckedChange={(checked) => setValue("notifications.dailyReminder", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="goal-alerts">Goal Achievement Alerts</Label>
                        <p className="text-sm text-slate-500">Notifications when you reach goals</p>
                      </div>
                      <Switch
                        id="goal-alerts"
                        checked={notifications.goalAlerts}
                        onCheckedChange={(checked) => setValue("notifications.goalAlerts", checked)}
                      />
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Notification Schedule</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Daily Reminder Time</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="9:00 AM" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="8am">8:00 AM</SelectItem>
                              <SelectItem value="9am">9:00 AM</SelectItem>
                              <SelectItem value="10am">10:00 AM</SelectItem>
                              <SelectItem value="6pm">6:00 PM</SelectItem>
                              <SelectItem value="7pm">7:00 PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Weekly Summary</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sunday" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sunday">Sunday</SelectItem>
                              <SelectItem value="monday">Monday</SelectItem>
                              <SelectItem value="friday">Friday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Privacy Settings */}
              {activeTab === "privacy" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="data-collection">Data Collection</Label>
                        <p className="text-sm text-slate-500">Allow collection of usage data to improve the app</p>
                      </div>
                      <Switch
                        id="data-collection"
                        checked={privacy.dataCollection}
                        onCheckedChange={(checked) => setValue("privacy.dataCollection", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="analytics">Analytics</Label>
                        <p className="text-sm text-slate-500">Help us understand how you use the app</p>
                      </div>
                      <Switch
                        id="analytics"
                        checked={privacy.analytics}
                        onCheckedChange={(checked) => setValue("privacy.analytics", checked)}
                      />
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Data Retention</h4>
                      <p className="text-sm text-slate-500 mb-4">
                        Your data is stored securely and can be deleted at any time. 
                        We automatically delete inactive accounts after 2 years.
                      </p>
                      <Button variant="outline" size="sm">
                        View Privacy Policy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Management */}
              {activeTab === "data" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Export Data</h4>
                      <p className="text-sm text-slate-500 mb-4">
                        Download all your data in JSON format. This includes all your daily updates, 
                        goals, and activity history.
                      </p>
                      <Button onClick={handleExport} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export All Data
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Import Data</h4>
                      <p className="text-sm text-slate-500 mb-4">
                        Import data from a previous export or another tracking app.
                      </p>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Import Data
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-2 text-red-600">Danger Zone</h4>
                      <p className="text-sm text-slate-500 mb-4">
                        Permanently delete all your data. This action cannot be undone.
                      </p>
                      <Button 
                        onClick={handleDeleteAllData}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}