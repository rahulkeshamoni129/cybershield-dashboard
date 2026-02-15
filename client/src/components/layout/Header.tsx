import { Bell, Search, User, Shield, Activity, Database, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useThreatContext } from '@/context/ThreatContext';
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
import { cn } from '@/lib/utils';


const Header = () => {
  const { user, logout } = useAuth();
  const { threats } = useThreatContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [lastReadTime, setLastReadTime] = useState(new Date());

  // Filter for NEW notifications (High/Critical severity only) that arrived after last read
  const notifications = threats
    .filter(t => t.severity >= 7 && new Date(t.timestamp) > lastReadTime);

  const unreadCount = notifications.length;

  const markAsRead = () => {
    setLastReadTime(new Date());
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkDBStatus = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setIsOnline(data.database === 'connected');
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkDBStatus();
    const interval = setInterval(checkDBStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (sev: number) => {
    if (sev >= 9) return 'bg-destructive';
    if (sev >= 7) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getSeverityLabel = (sev: number) => {
    if (sev >= 9) return 'Critical';
    if (sev >= 7) return 'High';
    return 'Info';
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <header className="fixed top-0 right-0 left-64 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="flex items-center justify-between h-full px-6">
        {/* Status indicators */}
        <div className="flex-1" />
        <div className="flex items-center gap-4">

          {/* System Status */}
          <div className="flex items-center gap-2 text-sm hidden md:flex">
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <Database className="h-4 w-4 text-accent" />
                  <span className="text-accent font-medium">DB Online</span>
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium">DB Offline</span>
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
          <div className="hidden lg:block font-mono text-sm text-muted-foreground">
            <span className="text-primary">{currentTime.toLocaleTimeString()}</span>
            <span className="ml-2 text-xs">{currentTime.toLocaleDateString()}</span>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-[10px] animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Alerts ({unreadCount})
                </DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      markAsRead();
                    }}
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />

              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <Bell className="h-8 w-8 opacity-20" />
                    <span>No new alerts</span>
                    <span className="text-[10px] opacity-50">Monitoring for critical threats...</span>
                  </div>
                ) : (
                  notifications.map((alert) => (
                    <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1 py-3 cursor-pointer border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", getSeverityColor(alert.severity), alert.severity >= 9 && "animate-pulse")} />
                        <span className="font-medium flex-1 truncate text-sm">
                          {getSeverityLabel(alert.severity)}: {alert.type}
                        </span>
                        {alert.source.country && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border font-mono">
                            {alert.source.country}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between w-full pl-4 mt-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate max-w-[180px]">
                          {alert.dataSource === 'AlienVault Reflected' ? (
                            <span className="text-blue-500">AlienVault</span>
                          ) : (
                            <span>Src: {alert.source.ip}</span>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>

              <DropdownMenuSeparator />
              <div className="p-2 text-center">
                <Button variant="ghost" size="sm" className="text-xs w-full">View All Alerts</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-medium">{user?.username || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => {
                logout();
                window.location.href = '/login';
              }}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
