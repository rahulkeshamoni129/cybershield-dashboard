import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Search,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Wifi,
  Server,
  Clock,
  Activity,
} from 'lucide-react';

interface IPResult {
  ip: string;
  riskScore: number;
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isBot: boolean;
  country: string;
  city: string;
  isp: string;
  reports: number;
  lastSeen: Date;
  categories: string[];
}

const mockCheckIP = (ip: string): IPResult => {
  const isHighRisk = Math.random() > 0.5;
  return {
    ip,
    riskScore: isHighRisk ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30),
    isVPN: Math.random() > 0.7,
    isProxy: Math.random() > 0.8,
    isTor: Math.random() > 0.9,
    isBot: Math.random() > 0.85,
    country: ['Russia', 'China', 'USA', 'Germany', 'Brazil'][Math.floor(Math.random() * 5)],
    city: ['Moscow', 'Beijing', 'New York', 'Berlin', 'São Paulo'][Math.floor(Math.random() * 5)],
    isp: ['ISP Corp', 'Global Net', 'Fast Internet', 'Cloud Provider'][Math.floor(Math.random() * 4)],
    reports: Math.floor(Math.random() * 100),
    lastSeen: new Date(Date.now() - Math.random() * 86400000 * 30),
    categories: isHighRisk
      ? ['Malware', 'Spam', 'Brute Force']
      : ['Clean'],
  };
};

const IPCheck = () => {
  const { token } = useAuth();
  const [ipInput, setIpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IPResult | null>(null);
  const [history, setHistory] = useState<IPResult[]>([]);

  const checkIP = async () => {
    if (!ipInput.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/threats/ip/${ipInput.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to check IP');
      }

      const data = json.data;

      const ipResult: IPResult = {
        ip: data.ipAddress,
        riskScore: data.abuseConfidenceScore,
        isVPN: data.isVpn || false,
        isProxy: data.isProxy || false,
        isTor: data.isTor || false,
        isBot: data.abuseConfidenceScore > 50, // Heuristic if not provided
        country: data.countryName || data.countryCode || 'Unknown',
        city: data.city || 'Unknown',
        isp: data.isp || 'Unknown',
        reports: data.totalReports || 0,
        lastSeen: data.lastReportedAt ? new Date(data.lastReportedAt) : new Date(),
        categories: data.abuseConfidenceScore > 50 ? ['Suspicious', 'Reported'] : ['Clean'],
      };

      setResult(ipResult);
      setHistory((prev) => {
        const filtered = prev.filter(h => h.ip !== ipResult.ip);
        return [ipResult, ...filtered.slice(0, 9)];
      });
    } catch (error) {
      console.error('IP Check Error:', error);
      // You might want to show a toast message here
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'text-critical', bg: 'bg-critical/20' };
    if (score >= 60) return { label: 'High', color: 'text-destructive', bg: 'bg-destructive/20' };
    if (score >= 40) return { label: 'Medium', color: 'text-warning', bg: 'bg-warning/20' };
    if (score >= 20) return { label: 'Low', color: 'text-info', bg: 'bg-info/20' };
    return { label: 'Safe', color: 'text-accent', bg: 'bg-accent/20' };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">IP Reputation Check</h1>
          <p className="text-muted-foreground mt-1">
            Analyze IP addresses for threats, VPN usage, and risk assessment
          </p>
        </div>

        {/* Search */}
        <div className="soc-card">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkIP()}
                className="pl-12 h-12 text-lg font-mono"
              />
            </div>
            <Button
              onClick={checkIP}
              disabled={isLoading || !ipInput.trim()}
              size="lg"
              className="px-8"
            >
              {isLoading ? (
                <Activity className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Check IP
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Main Result Card */}
            <Card className="soc-card lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-mono">{result.ip}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {result.city}, {result.country}
                    </CardDescription>
                  </div>
                  <div
                    className={cn(
                      'px-6 py-3 rounded-lg text-center',
                      getRiskLevel(result.riskScore).bg
                    )}
                  >
                    <p className="text-3xl font-bold font-mono">{result.riskScore}</p>
                    <p className={cn('text-sm font-medium', getRiskLevel(result.riskScore).color)}>
                      {getRiskLevel(result.riskScore).label} Risk
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Risk Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                      <span className="text-sm font-mono">{result.riskScore}/100</span>
                    </div>
                    <Progress
                      value={result.riskScore}
                      className={cn(
                        'h-3',
                        result.riskScore >= 60 && '[&>div]:bg-destructive',
                        result.riskScore >= 40 && result.riskScore < 60 && '[&>div]:bg-warning',
                        result.riskScore < 40 && '[&>div]:bg-accent'
                      )}
                    />
                  </div>

                  {/* Flags Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                      className={cn(
                        'p-4 rounded-lg border text-center',
                        result.isVPN
                          ? 'bg-warning/10 border-warning/30'
                          : 'bg-muted/30 border-border'
                      )}
                    >
                      <Wifi className={cn('h-6 w-6 mx-auto mb-2', result.isVPN ? 'text-warning' : 'text-muted-foreground')} />
                      <p className="text-sm font-medium">VPN</p>
                      <p className={cn('text-xs', result.isVPN ? 'text-warning' : 'text-muted-foreground')}>
                        {result.isVPN ? 'Detected' : 'Not Detected'}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'p-4 rounded-lg border text-center',
                        result.isProxy
                          ? 'bg-warning/10 border-warning/30'
                          : 'bg-muted/30 border-border'
                      )}
                    >
                      <Server className={cn('h-6 w-6 mx-auto mb-2', result.isProxy ? 'text-warning' : 'text-muted-foreground')} />
                      <p className="text-sm font-medium">Proxy</p>
                      <p className={cn('text-xs', result.isProxy ? 'text-warning' : 'text-muted-foreground')}>
                        {result.isProxy ? 'Detected' : 'Not Detected'}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'p-4 rounded-lg border text-center',
                        result.isTor
                          ? 'bg-destructive/10 border-destructive/30'
                          : 'bg-muted/30 border-border'
                      )}
                    >
                      <Shield className={cn('h-6 w-6 mx-auto mb-2', result.isTor ? 'text-destructive' : 'text-muted-foreground')} />
                      <p className="text-sm font-medium">Tor</p>
                      <p className={cn('text-xs', result.isTor ? 'text-destructive' : 'text-muted-foreground')}>
                        {result.isTor ? 'Detected' : 'Not Detected'}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'p-4 rounded-lg border text-center',
                        result.isBot
                          ? 'bg-destructive/10 border-destructive/30'
                          : 'bg-muted/30 border-border'
                      )}
                    >
                      <Activity className={cn('h-6 w-6 mx-auto mb-2', result.isBot ? 'text-destructive' : 'text-muted-foreground')} />
                      <p className="text-sm font-medium">Bot</p>
                      <p className={cn('text-xs', result.isBot ? 'text-destructive' : 'text-muted-foreground')}>
                        {result.isBot ? 'Detected' : 'Not Detected'}
                      </p>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Threat Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {result.categories.map((cat) => (
                        <Badge
                          key={cat}
                          className={cn(
                            cat === 'Clean'
                              ? 'bg-accent/20 text-accent border-accent/30'
                              : 'bg-destructive/20 text-destructive border-destructive/30'
                          )}
                        >
                          {cat === 'Clean' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="soc-card">
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">ISP</span>
                  <span className="font-medium">{result.isp}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Reports</span>
                  <Badge variant={result.reports > 50 ? 'destructive' : 'outline'}>
                    {result.reports}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Last Seen</span>
                  <span className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {result.lastSeen.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="soc-card">
            <h3 className="text-lg font-semibold mb-4">Recent Checks</h3>
            <div className="flex flex-wrap gap-2">
              {history.map((item, index) => {
                const risk = getRiskLevel(item.riskScore);
                return (
                  <Button
                    key={`${item.ip}-${index}`}
                    variant="outline"
                    size="sm"
                    onClick={() => setResult(item)}
                    className={cn('font-mono', risk.color)}
                  >
                    {item.ip}
                    <Badge className={cn('ml-2 text-[10px]', risk.bg, risk.color)}>
                      {item.riskScore}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default IPCheck;
