import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export function UserPanel() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const userTyped = user as UserType;
  const displayName = userTyped.firstName && userTyped.lastName 
    ? `${userTyped.firstName} ${userTyped.lastName}`
    : userTyped.email || 'User';

  const initials = userTyped.firstName && userTyped.lastName
    ? `${userTyped.firstName[0]}${userTyped.lastName[0]}`
    : userTyped.email ? userTyped.email[0].toUpperCase() : 'U';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={userTyped.profileImageUrl || undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{displayName}</p>
            {userTyped.email && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{userTyped.email}</p>
            )}
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/api/logout'}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}