import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Palette, Grid, Eye, EyeOff } from "lucide-react";

interface Widget {
  id: string;
  type: 'metrics' | 'tasks' | 'projects' | 'chart' | 'activity';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  visible: boolean;
}

interface WidgetSettingsProps {
  widgets: Widget[];
  onWidgetUpdate: (widgets: Widget[]) => void;
  onClose: () => void;
}

export function WidgetSettings({ widgets, onWidgetUpdate, onClose }: WidgetSettingsProps) {
  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, ...updates } : widget
    );
    onWidgetUpdate(updatedWidgets);
  };

  const resetToDefault = () => {
    const defaultWidgets: Widget[] = [
      { id: 'tasks-metrics', type: 'metrics', title: 'Task Metrics', size: 'small', position: { x: 0, y: 0 }, visible: true },
      { id: 'project-metrics', type: 'metrics', title: 'Project Metrics', size: 'small', position: { x: 1, y: 0 }, visible: true },
      { id: 'completion-rate', type: 'metrics', title: 'Completion Rate', size: 'small', position: { x: 2, y: 0 }, visible: true },
      { id: 'recent-tasks', type: 'tasks', title: 'Recent Tasks', size: 'large', position: { x: 0, y: 1 }, visible: true },
      { id: 'progress-chart', type: 'chart', title: 'Progress Chart', size: 'medium', position: { x: 2, y: 1 }, visible: true },
    ];
    onWidgetUpdate(defaultWidgets);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Widget Settings</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Widget Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configure Widgets</h3>
          <div className="space-y-3">
            {widgets.map((widget) => (
              <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={widget.visible}
                      onCheckedChange={(checked) => updateWidget(widget.id, { visible: checked })}
                    />
                    <Label className="font-medium">{widget.title}</Label>
                  </div>
                  <Badge variant={widget.visible ? "default" : "secondary"}>
                    {widget.visible ? "Visible" : "Hidden"}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select
                    value={widget.size}
                    onValueChange={(size: 'small' | 'medium' | 'large') => 
                      updateWidget(widget.id, { size })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center space-x-2">
            <Grid className="h-4 w-4" />
            <span>Layout Options</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={resetToDefault}
              className="w-full"
            >
              Reset to Default
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Save current layout to localStorage
                localStorage.setItem('dashboardLayout', JSON.stringify(widgets));
              }}
              className="w-full"
            >
              Save Layout
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline"
              onClick={() => {
                const updatedWidgets = widgets.map(w => ({ ...w, visible: true }));
                onWidgetUpdate(updatedWidgets);
              }}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Show All
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const updatedWidgets = widgets.map(w => ({ ...w, visible: false }));
                onWidgetUpdate(updatedWidgets);
              }}
              className="w-full"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Hide All
            </Button>
          </div>
        </div>

        {/* Widget Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Widget Information</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Task Metrics:</strong> Shows total tasks, completed tasks, and completion status</p>
            <p><strong>Project Metrics:</strong> Displays project statistics and completion rates</p>
            <p><strong>Completion Rate:</strong> Visual progress bars for task completion</p>
            <p><strong>Recent Tasks:</strong> List of your most recent task updates</p>
            <p><strong>Progress Chart:</strong> Overview chart of your progress metrics</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}