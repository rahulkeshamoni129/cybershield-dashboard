import { Bell, Search, User, Shield, Activity, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="fixed top-0 right-0 left-64 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search threats, IPs, incidents..."
              className="pl-10 bg-muted/50 border-border focus:border-primary"
            />
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-6">
          {/* System Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-accent" />
                  <span className="text-accent font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium">Offline</span>
                </>
              )}
            </div>
            <span className="text-border">|</span>
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-muted-foreground">Live</span>
            </div>
          </div>

          {/* Time */}
          <div className="font-mono text-sm text-muted-foreground">
            <span className="text-primary">{currentTime.toLocaleTimeString()}</span>
            <span className="ml-2 text-xs">{currentTime.toLocaleDateString()}</span>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-[10px]">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Security Alerts
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="font-medium">Critical: Ransomware detected</span>
                </div>
                <span className="text-xs text-muted-foreground">2 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <span className="font-medium">High: Unusual outbound traffic</span>
                </div>
                <span className="text-xs text-muted-foreground">15 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-info" />
                  <span className="font-medium">Info: Scan completed</span>
                </div>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">SOC Analyst</p>
                  <p className="text-xs text-muted-foreground">admin@cybershield.io</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
