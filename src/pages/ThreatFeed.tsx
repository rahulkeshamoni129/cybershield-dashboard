import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { generateThreats, Threat } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Shield,
  Clock,
  MapPin,
} from 'lucide-react';

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

const ThreatFeed = () => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [filteredThreats, setFilteredThreats] = useState<Threat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadThreats();
  }, []);

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
      filtered = filtered.filter((t) => t.severity === severityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    setFilteredThreats(filtered);
  }, [threats, searchQuery, severityFilter, statusFilter]);

  const loadThreats = () => {
    setIsLoading(true);
    setTimeout(() => {
      setThreats(generateThreats(100));
      setIsLoading(false);
    }, 500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString();
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
            </p>
          </div>
          <Button onClick={loadThreats} disabled={isLoading}>
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{threat.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('uppercase text-[10px]', severityStyles[threat.severity])}>
                        {threat.severity}
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
    </MainLayout>
  );
};

export default ThreatFeed;
