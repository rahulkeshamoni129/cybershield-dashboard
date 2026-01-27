import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Shield,
  Globe,
  Search,
  QrCode,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Shield, label: 'Threat Feed', path: '/threats' },
  { icon: Globe, label: 'Network Scan', path: '/network' },
  { icon: Search, label: 'IP Verification', path: '/ip-check' },
  { icon: QrCode, label: 'QR/Barcode Scan', path: '/qr-scan' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: AlertTriangle, label: 'Incidents', path: '/incidents' },
  { icon: MessageSquare, label: 'AI Assistant', path: '/chat' },
];

const Sidebar = () => {
  const { isAdmin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="relative">
            <Shield className="h-8 w-8 text-primary" />
            <Activity className="h-3 w-3 text-accent absolute -bottom-0.5 -right-0.5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg gradient-text">CyberShield</span>
              <span className="text-[10px] text-muted-foreground -mt-1">SOC Platform</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-soc">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive ? 'text-primary' : 'group-hover:text-primary'
                )}
              />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin Navigation */}
      {isAdmin && (
        <div className="px-2 py-2 border-t border-sidebar-border">
          <div className={cn("px-4 mb-1 text-xs font-semibold text-muted-foreground", collapsed && "hidden")}>
            ADMIN
          </div>
          <Link
            to="/admin/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all',
              location.pathname === '/admin/dashboard' && 'bg-primary/10 text-primary',
              collapsed && 'justify-center px-2'
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            {!collapsed && <span className="font-medium text-sm">Admin Panel</span>}
          </Link>
          <Link
            to="/admin/users"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all',
              location.pathname === '/admin/users' && 'bg-primary/10 text-primary',
              collapsed && 'justify-center px-2'
            )}
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span className="font-medium text-sm">Users</span>}
          </Link>
        </div>
      )}

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all',
            collapsed && 'justify-center px-2'
          )}
        >
          <Settings className="h-5 w-5" />
          {!collapsed && <span className="font-medium text-sm">Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-sidebar border border-sidebar-border rounded-full p-1 hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
