import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Move, X, Plus, Grid, BarChart3, Target, Clock, TrendingUp, CheckCircle, Briefcase } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { WidgetSettings } from "./widget-settings";
import type { UserUpdate, Project, Team, TeamMembership } from "@shared/schema";

interface Widget {
  id: string;
  type: 'metrics' | 'tasks' | 'projects' | 'chart' | 'activity';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  visible: boolean;
}

interface WidgetLayoutProps {
  metrics?: any;
  userTasks?: (UserUpdate & { project?: Project })[];
  userTeams?: (TeamMembership & { team: Team })[];
  isLoading?: boolean;
}

const defaultWidgets: Widget[] = [
  { id: 'tasks-metrics', type: 'metrics', title: 'Task Metrics', size: 'small', position: { x: 0, y: 0 }, visible: true },
  { id: 'project-metrics', type: 'metrics', title: 'Project Metrics', size: 'small', position: { x: 1, y: 0 }, visible: true },
  { id: 'completion-rate', type: 'metrics', title: 'Completion Rate', size: 'small', position: { x: 2, y: 0 }, visible: true },
  { id: 'recent-tasks', type: 'tasks', title: 'Recent Tasks', size: 'large', position: { x: 0, y: 1 }, visible: true },
  { id: 'progress-chart', type: 'chart', title: 'Progress Chart', size: 'medium', position: { x: 2, y: 1 }, visible: true },
];

export function WidgetLayout({ metrics, userTasks = [], userTeams = [], isLoading = false }: WidgetLayoutProps) {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved layout from localStorage on component mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        setWidgets(parsedLayout);
      } catch (error) {
        console.warn('Failed to load saved dashboard layout:', error);
      }
    }
  }, []);

  // Save layout to localStorage whenever widgets change
  useEffect(() => {
    localStorage.setItem('dashboardLayout', JSON.stringify(widgets));
  }, [widgets]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
  }, [widgets]);

  const toggleWidget = (widgetId: string) => {
    setWidgets(widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const changeWidgetSize = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    setWidgets(widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, size }
        : widget
    ));
  };

  const getWidgetSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      default: return 'col-span-1';
    }
  };

  const renderTaskMetricsWidget = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Tasks</p>
            <p className="text-2xl font-bold">{metrics?.totalTasks || 0}</p>
            <p className="text-xs text-gray-600">{metrics?.completedTasks || 0} completed</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </CardContent>
    </Card>
  );

  const renderProjectMetricsWidget = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Projects</p>
            <p className="text-2xl font-bold">{metrics?.totalProjects || 0}</p>
            <p className="text-xs text-gray-600">{metrics?.completedProjects || 0} completed</p>
          </div>
          <Briefcase className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );

  const renderCompletionRateWidget = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Task Completion Rate</p>
            <p className="text-2xl font-bold">{metrics?.taskCompletionRate || 0}%</p>
            <Progress value={metrics?.taskCompletionRate || 0} className="h-2 mt-2" />
          </div>
          <TrendingUp className="h-8 w-8 text-orange-600" />
        </div>
      </CardContent>
    </Card>
  );

  const renderRecentTasksWidget = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userTasks.slice(0, 5).map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{task.title}</h4>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderProgressChartWidget = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progress Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Completed Tasks</span>
              <span>{metrics?.completedTasks || 0}/{metrics?.totalTasks || 0}</span>
            </div>
            <Progress value={metrics?.taskCompletionRate || 0} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Completed Projects</span>
              <span>{metrics?.completedProjects || 0}/{metrics?.totalProjects || 0}</span>
            </div>
            <Progress value={metrics?.projectCompletionRate || 0} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "BLOCKED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "REVIEW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'metrics':
        if (widget.id === 'tasks-metrics') return renderTaskMetricsWidget();
        if (widget.id === 'project-metrics') return renderProjectMetricsWidget();
        if (widget.id === 'completion-rate') return renderCompletionRateWidget();
        return <Card><CardContent className="p-4">Metrics widget</CardContent></Card>;
      case 'tasks':
        return renderRecentTasksWidget();
      case 'chart':
        return renderProgressChartWidget();
      default:
        return <Card><CardContent className="p-4">Widget type not implemented</CardContent></Card>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Widget Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <div className="flex space-x-2">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Widget Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <WidgetSettings 
                widgets={widgets}
                onWidgetUpdate={setWidgets}
                onClose={() => setShowSettings(false)}
              />
            </DialogContent>
          </Dialog>
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Move className="h-4 w-4 mr-2" />
            {isEditMode ? "Done Editing" : "Rearrange"}
          </Button>
        </div>
      </div>

      {/* Edit Mode Controls */}
      {isEditMode && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <h3 className="font-medium text-blue-900">Customize Your Dashboard</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm">{widget.title}</span>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant={widget.visible ? "default" : "outline"}
                      onClick={() => toggleWidget(widget.id)}
                      className="h-6 w-6 p-0"
                    >
                      {widget.visible ? "✓" : "○"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Widgets Grid */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="widgets">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {widgets
                .filter(widget => widget.visible)
                .map((widget, index) => (
                  <Draggable 
                    key={widget.id} 
                    draggableId={widget.id} 
                    index={index}
                    isDragDisabled={!isEditMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${getWidgetSizeClass(widget.size)} ${
                          snapshot.isDragging ? 'opacity-50' : ''
                        } ${isEditMode ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}`}
                      >
                        {isEditMode && (
                          <div 
                            {...provided.dragHandleProps}
                            className="flex items-center justify-center p-2 bg-blue-100 rounded-t cursor-move"
                          >
                            <Move className="h-4 w-4 text-blue-600" />
                            <span className="ml-2 text-sm text-blue-700">{widget.title}</span>
                          </div>
                        )}
                        {renderWidget(widget)}
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}