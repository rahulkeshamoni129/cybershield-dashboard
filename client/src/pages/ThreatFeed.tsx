import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Threat } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThreatContext } from '@/context/ThreatContext'; // Import hook
import { useAuth } from '@/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Shield,
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  Activity,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const severityStyles = {
  critical: 'threat-critical',
  high: 'threat-high',
  medium: 'threat-medium',
  low: 'threat-low',
};

const statusStyles = {
  active: 'bg-destructive/20 text-destructive border-destructive/30',
  mitigated: 'bg-accent/20 text-accent border-accent/30',
  investigating: 'bg-warning/20 text-warning border-warning/30',
};

const getSeverityLabel = (s: number | string) => {
  if (typeof s === 'string') return s.toLowerCase();
  if (s >= 9) return 'critical';
  if (s >= 7) return 'high';
  if (s >= 4) return 'medium';
  return 'low';
};

const ThreatFeed = () => {
  const { threats, refreshThreats, isLoading } = useThreatContext();
  const { isAdmin } = useAuth();
  const [filteredThreats, setFilteredThreats] = useState<Threat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    let filtered = threats;

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.source.ip.includes(searchQuery) ||
          t.source.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((t) => getSeverityLabel(t.severity) === severityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    setFilteredThreats(filtered);
  }, [threats, searchQuery, severityFilter, statusFilter]);

  const formatTime = (date: Date) => {
    return date.toLocaleString();
  };

  const handlePromoteToIncident = async (threat: Threat) => {
    setIsPromoting(true);
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `${threat.type} from ${threat.source.ip}`,
          description: `Automatic promotion of threat detected at ${threat.timestamp.toLocaleString()}. \nSource: ${threat.source.ip} (${threat.source.country})\nTarget: ${threat.target.ip} (${threat.target.country})`,
          severity: getSeverityLabel(threat.severity).charAt(0).toUpperCase() + getSeverityLabel(threat.severity).slice(1),
          affectedAssets: ['Gateway', 'Threat Intelligence Node'],
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Threat promoted to incident successfully.',
        });
        setSelectedThreat(null);
        // Optional: Navigate to incidents page
        // navigate('/incidents');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to promote threat to incident.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error promoting threat:', error);
      toast({
        title: 'Network Error',
        description: 'Could not connect to the management server.',
        variant: 'destructive',
      });
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Threat Intelligence Feed</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and analyze detected threats in real-time
              {isAdmin && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Admin View Active</span>}
            </p>
          </div>
          <Button onClick={refreshThreats} disabled={isLoading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="soc-card">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search threats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="mitigated">Mitigated</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground">
              Showing {filteredThreats.length} of {threats.length} threats
            </div>
          </div>
        </div>

        {/* Threats Table */}
        <div className="soc-card p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px]">ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>MITRE ATT&CK</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThreats.map((threat, index) => (
                  <TableRow
                    key={threat.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <TableCell className="font-mono text-xs text-primary">
                      {threat.id}
                      {isAdmin && threat.dataSource && (
                        <div className="mt-1">
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded border",
                            threat.dataSource.includes('AlienVault')
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                          )}>
                            {threat.dataSource}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{threat.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('uppercase text-[10px]', severityStyles[getSeverityLabel(threat.severity)])}>
                        {getSeverityLabel(threat.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{threat.source.ip}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {threat.source.country}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{threat.target.ip}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {threat.target.country}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{threat.mitreTactic}</span>
                        <span className="font-mono text-[10px] text-primary">
                          {threat.mitreId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px] capitalize', statusStyles[threat.status])}>
                        {threat.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(threat.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedThreat(threat)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>

      {/* Threat Detail Modal */}
      <Dialog open={!!selectedThreat} onOpenChange={(open) => !open && setSelectedThreat(null)}>
        <DialogContent className="soc-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-6 w-6 text-primary" />
              Threat Analysis: {selectedThreat?.id}
            </DialogTitle>
            <DialogDescription>
              Detailed technical analysis of the detected threat event
            </DialogDescription>
          </DialogHeader>

          {selectedThreat && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Source Information</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{selectedThreat.source.ip}</span>
                      <Badge variant="outline" className="text-[10px]">{selectedThreat.source.country}</Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Target Information</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{selectedThreat.target.ip}</span>
                      <Badge variant="outline" className="text-[10px]">{selectedThreat.target.country}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Severity & Status</p>
                    <div className="flex items-center gap-2">
                      <Badge className={severityStyles[getSeverityLabel(selectedThreat.severity)]}>
                        {getSeverityLabel(selectedThreat.severity).toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">{selectedThreat.status}</Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Incident Time</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {selectedThreat.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Security Intelligence
                  </h4>
                  {selectedThreat.dataSource && (
                    <Badge variant="outline" className="text-[10px] opacity-70">Provider: {selectedThreat.dataSource}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Attack Type</p>
                    <p className="font-medium text-primary">{selectedThreat.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MITRE ATT&CK</p>
                    <p className="font-medium">{selectedThreat.mitreTactic} ({selectedThreat.mitreId})</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Analyst Note</p>
                    <p className="mt-1">
                      High-confidence detection from {selectedThreat.dataSource || 'local probe'}.
                      The pattern suggests {selectedThreat.type.toLowerCase()} targeting internal infrastructure assets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handlePromoteToIncident(selectedThreat)}
                  disabled={isPromoting}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  {isPromoting ? 'Promoting...' : 'Promote to Incident'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/chat')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Analyze with AI
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ThreatFeed;
