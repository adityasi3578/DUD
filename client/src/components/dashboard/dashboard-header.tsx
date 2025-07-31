import { useState } from "react";
import { Download, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function DashboardHeader() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const response = await apiRequest("/api/export", "GET");
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 lg:ml-0">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg lg:text-2xl font-semibold text-slate-900 truncate">Daily Update Dashboard</h2>
          <p className="text-slate-600 mt-1 text-sm lg:text-base">
            {selectedDate === new Date().toISOString().split('T')[0] 
              ? `Today, ${formatDate(selectedDate)}`
              : formatDate(selectedDate)
            }
          </p>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-3 ml-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto text-sm lg:text-base"
          />
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 text-xs lg:text-sm px-2 lg:px-4">
            <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
