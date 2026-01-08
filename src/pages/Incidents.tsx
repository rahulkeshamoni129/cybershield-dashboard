import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { generateIncidents, Incident } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  AlertTriangle,
  Clock,
  User,
  Server,
  CheckCircle,
  XCircle,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

const severityStyles = {
  critical: { bg: 'bg-critical/10', border: 'border-critical/30', text: 'text-critical' },
  high: { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive' },
  medium: { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' },
  low: { bg: 'bg-info/10', border: 'border-info/30', text: 'text-info' },
};

const statusStyles = {
  open: { bg: 'bg-destructive/20', text: 'text-destructive', icon: XCircle },
  investigating: { bg: 'bg-warning/20', text: 'text-warning', icon: AlertTriangle },
  resolved: { bg: 'bg-accent/20', text: 'text-accent', icon: CheckCircle },
  closed: { bg: 'bg-muted', text: 'text-muted-foreground', icon: CheckCircle },
};

const Incidents = () => {
  const [incidents] = useState<Incident[]>(generateIncidents());
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    open: incidents.filter((i) => i.status === 'open').length,
    investigating: incidents.filter((i) => i.status === 'investigating').length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
    critical: incidents.filter((i) => i.severity === 'critical').length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Incident Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage security incidents
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="soc-card max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Incident</DialogTitle>
                <DialogDescription>
                  Report a new security incident for investigation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input placeholder="Incident title..." className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea placeholder="Describe the incident..." className="mt-1" rows={4} />
                </div>
                <Button className="w-full">Create Incident</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="soc-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.open}</p>
                  <p className="text-sm text-muted-foreground">Open</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="soc-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-warning">{stats.investigating}</p>
                  <p className="text-sm text-muted-foreground">Investigating</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="soc-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-accent">{stats.resolved}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
                <CheckCircle className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="soc-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-critical">{stats.critical}</p>
                  <p className="text-sm text-muted-foreground">Critical</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-critical/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Incident List & Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1">
            <Card className="soc-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Incidents</CardTitle>
                <CardDescription>{filteredIncidents.length} total incidents</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1 p-4 pt-0">
                    {filteredIncidents.map((incident) => {
                      const StatusIcon = statusStyles[incident.status].icon;
                      return (
                        <div
                          key={incident.id}
                          className={cn(
                            'p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50',
                            selectedIncident?.id === incident.id && 'bg-primary/10 border border-primary/30'
                          )}
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <div className="flex items-start gap-3">
                            <StatusIcon
                              className={cn('h-5 w-5 mt-0.5', statusStyles[incident.status].text)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{incident.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  className={cn(
                                    'text-[10px]',
                                    severityStyles[incident.severity].bg,
                                    severityStyles[incident.severity].text
                                  )}
                                >
                                  {incident.severity}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {incident.id}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {selectedIncident ? (
              <Card className="soc-card animate-fade-in">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={cn(
                            'text-xs uppercase',
                            severityStyles[selectedIncident.severity].bg,
                            severityStyles[selectedIncident.severity].text,
                            severityStyles[selectedIncident.severity].border
                          )}
                        >
                          {selectedIncident.severity}
                        </Badge>
                        <Badge
                          className={cn(
                            'capitalize',
                            statusStyles[selectedIncident.status].bg,
                            statusStyles[selectedIncident.status].text
                          )}
                        >
                          {selectedIncident.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{selectedIncident.title}</CardTitle>
                      <CardDescription className="font-mono">{selectedIncident.id}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <User className="h-4 w-4" />
                        <span className="text-xs">Assignee</span>
                      </div>
                      <p className="font-medium">{selectedIncident.assignee}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Created</span>
                      </div>
                      <p className="font-medium">{selectedIncident.createdAt.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Affected Assets */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Affected Assets
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.affectedAssets.map((asset) => (
                        <Badge key={asset} variant="outline" className="font-mono">
                          {asset}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Timeline
                    </h4>
                    <div className="space-y-4">
                      {selectedIncident.timeline.map((event, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            {index < selectedIncident.timeline.length - 1 && (
                              <div className="w-px h-full bg-border" />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="text-sm font-medium">{event.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.user} • {event.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button className="flex-1">Update Status</Button>
                    <Button variant="outline" className="flex-1">Add Note</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="soc-card h-[600px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an incident to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Incidents;
