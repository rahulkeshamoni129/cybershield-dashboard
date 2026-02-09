import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { NetworkDevice } from '@/data/mockData';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Server,
  Monitor,
  Router,
  Shield,
  HardDrive,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Network,
  Wifi,
} from 'lucide-react';

import { io } from 'socket.io-client';


const deviceIcons = {
  server: Server,
  workstation: Monitor,
  router: Router,
  firewall: Shield,
  switch: HardDrive,
};

const statusConfig = {
  online: { icon: CheckCircle, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
  offline: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
};

const NetworkScan = () => {
  const { token } = useAuth();
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [hasStartedScan, setHasStartedScan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [targetIP, setTargetIP] = useState('127.0.0.1');
  // Use ref to access latest targetIP in socket callbacks without re-triggering effect
  const targetIPRef = useRef(targetIP);
  const { toast } = useToast();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    targetIPRef.current = targetIP;
  }, [targetIP]);

  useEffect(() => {
    if (!token) return;

    // Setup Socket
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('scan_progress', (progress: number) => {
      setScanProgress(progress);
    });

    socket.on('device_discovered', (device: NetworkDevice) => {
      setDevices(prev => {
        if (prev.find(d => d.id === device.id)) return prev;
        return [...prev, device];
      });
    });

    socket.on('scan_complete', (allDevices: NetworkDevice[]) => {
      setDevices(allDevices);
      setScanning(false);
      setScanProgress(100);
      toast({
        title: "Scan Complete",
        description: `Found ${allDevices.length} devices on ${targetIPRef.current}`,
      });
    });

    socket.on('scan_error', (msg: string) => {
      setScanning(false);
      setScanProgress(0);
      toast({
        title: "Scan Failed",
        description: msg,
        variant: "destructive",
        duration: 5000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const startScan = () => {
    if (!targetIP) {
      toast({
        title: "Invalid Target",
        description: "Please enter a valid IP address or Range",
        variant: "destructive"
      });
      return;
    }
    setScanning(true);
    setHasStartedScan(true);
    setScanProgress(0);
    setDevices([]); // Clear for fresh scan effect
    if (socketRef.current) {
      socketRef.current.emit('start_network_scan', targetIP);
    }
  };


  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const warningCount = devices.filter((d) => d.status === 'warning').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const totalVulnerabilities = devices.reduce((acc, d) => acc + d.vulnerabilities, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Network Scan</h1>
            <p className="text-muted-foreground mt-1">
              Discover and monitor network devices and vulnerabilities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={targetIP}
              onChange={(e) => setTargetIP(e.target.value)}
              placeholder="Enter IP (e.g. 192.168.1.1 or 192.168.1.0/24)"
              className="w-64"
              disabled={scanning}
            />
            <Button onClick={startScan} disabled={scanning}>
              {scanning ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {scanning ? 'Scanning...' : 'Start Scan'}
            </Button>
          </div>
        </div>

        {/* Scan Progress */}
        {scanning && (
          <div className="soc-card scan-line">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Scanning network...</span>
              <span className="text-sm text-primary font-mono">{scanProgress}%</span>
            </div>
            <Progress value={scanProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Discovering devices and checking for vulnerabilities...
            </p>
          </div>
        )}

        {!hasStartedScan ? (
          <div className="flex flex-col items-center justify-center py-20 soc-card opacity-60">
            <Network className="h-16 w-16 text-muted-foreground mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold">Ready to Scan</h2>
            <p className="text-muted-foreground max-w-sm text-center mt-2">
              Enter a target IP or range above and click "Start Scan" to discover devices on your network.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="soc-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/20">
                      <Network className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{devices.length}</p>
                      <p className="text-sm text-muted-foreground">Total Devices</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="soc-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent/20">
                      <Wifi className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{onlineCount}</p>
                      <p className="text-sm text-muted-foreground">Online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="soc-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-warning/20">
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{warningCount + offlineCount}</p>
                      <p className="text-sm text-muted-foreground">Issues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="soc-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-destructive/20">
                      <Shield className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalVulnerabilities}</p>
                      <p className="text-sm text-muted-foreground">Vulnerabilities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {devices.length === 0 && !scanning ? (
              <div className="flex flex-col items-center justify-center py-12 soc-card">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Devices Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The scan completed but no active devices were detected on {targetIP}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => {
                  const DeviceIcon = deviceIcons[device.type];
                  const StatusIcon = statusConfig[device.status].icon;
                  const isSelected = selectedDevice?.id === device.id;

                  return (
                    <Card
                      key={device.id}
                      className={cn(
                        'soc-card cursor-pointer transition-all hover:border-primary/50',
                        isSelected && 'border-primary shadow-glow-primary'
                      )}
                      onClick={() => setSelectedDevice(device)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn('p-2 rounded-lg', statusConfig[device.status].bg)}>
                              <DeviceIcon className={cn('h-5 w-5', statusConfig[device.status].color)} />
                            </div>
                            <div>
                              <CardTitle className="text-base">{device.name}</CardTitle>
                              <CardDescription className="font-mono text-xs">
                                {device.ip}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              'capitalize text-[10px]',
                              statusConfig[device.status].bg,
                              statusConfig[device.status].color,
                              statusConfig[device.status].border
                            )}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {device.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Type</span>
                            <span className="capitalize">{device.type}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Open Ports</span>
                            <span className="font-mono text-primary">
                              {device.openPorts.length > 0 ? device.openPorts.join(', ') : 'None'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Vulnerabilities</span>
                            <Badge
                              variant={device.vulnerabilities > 0 ? 'destructive' : 'outline'}
                              className="text-[10px]"
                            >
                              {device.vulnerabilities}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last scan: {device.lastScan ? new Date(device.lastScan).toLocaleString() : 'Never'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </MainLayout>
  );
};

export default NetworkScan;
