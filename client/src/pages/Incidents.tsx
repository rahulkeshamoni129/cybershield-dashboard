import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { generateIncidents, Incident } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newIncidentData, setNewIncidentData] = useState({ title: '', description: '', severity: 'Medium' });
  const [noteText, setNoteText] = useState('');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token, isAuthenticated, user } = useAuth();

  // Fetch Incidents from Backend
  useEffect(() => {
    const fetchIncidents = async () => {
      if (!isAuthenticated || !token) return;
      try {
        const response = await fetch('/api/incidents', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          // Convert date strings to Date objects
          const processedData = data.map((item: any) => ({
            ...item,
            created: new Date(item.created),
            // createdAt: new Date(item.created), // Compatibility mappping
            timeline: item.timeline ? item.timeline.map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })) : []
          }));
          setIncidents(processedData);
        } else {
          console.error('Failed to fetch incidents');
        }
      } catch (error) {
        console.error('Error fetching incidents:', error);
      }
    };

    fetchIncidents();
  }, [token, isAuthenticated]);

  const handleCreateIncident = async () => {
    if (!newIncidentData.title) {
      toast({ title: 'Error', description: 'Please provide a title', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newIncidentData),
      });

      if (response.ok) {
        const createdIncident = await response.json();
        const processed = {
          ...createdIncident,
          created: new Date(createdIncident.created),
          timeline: createdIncident.timeline.map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp)
          }))
        };
        setIncidents([processed, ...incidents]);
        setIsCreateDialogOpen(false);
        setNewIncidentData({ title: '', description: '', severity: 'Medium' });
        toast({ title: 'Success', description: 'Incident created successfully' });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
        toast({
          title: 'Error',
          description: `Failed: ${errorData.message || response.statusText}`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error creating incident:', error);
      toast({
        title: 'Network Error',
        description: error.message || 'Could not connect to server',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedIncident) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/incidents/${selectedIncident.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          title: selectedIncident.title,
          description: selectedIncident.description,
          severity: selectedIncident.severity,
          affectedAssets: selectedIncident.affectedAssets
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setIncidents(incidents.map((i) => (i.id === updated.id ? { ...updated, created: new Date(updated.created), timeline: updated.timeline.map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })) } : i)));
        setSelectedIncident({ ...updated, created: new Date(updated.created), timeline: updated.timeline.map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })) });
        toast({ title: 'Success', description: `Status updated to ${status}` });
      } else {
        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedIncident || !noteText) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/incidents/${selectedIncident.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          note: noteText,
          title: selectedIncident.title,
          description: selectedIncident.description,
          severity: selectedIncident.severity,
          affectedAssets: selectedIncident.affectedAssets
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setIncidents(incidents.map((i) => (i.id === updated.id ? { ...updated, created: new Date(updated.created), timeline: updated.timeline.map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })) } : i)));
        setSelectedIncident({ ...updated, created: new Date(updated.created), timeline: updated.timeline.map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })) });
        setNoteText('');
        setIsNoteDialogOpen(false);
        toast({ title: 'Success', description: 'Note added' });
      } else {
        toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Listen for Real-time WebSocket Updates
  useEffect(() => {
    const socketUrl = import.meta.env.PROD ? '/' : 'http://localhost:5000';

    // Dynamically import socket.io-client to avoid build issues if types are missing at top level
    import('socket.io-client').then(({ io }) => {
      const socket = io(socketUrl);

      socket.on('connect', () => {
        console.log('Incidents Page: Connected to WebSocket');
      });

      socket.on('attack_event', (attack: any) => {
        // Convert Attack Event to Incident
        const severityScore = attack.severity || 5;
        let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
        if (severityScore >= 9) severity = 'Critical';
        else if (severityScore >= 7) severity = 'High';
        else if (severityScore <= 3) severity = 'Low';

        const newIncident: Incident = {
          id: `LIVE-${attack.id}`,
          title: `${attack.attackType} from ${attack.ipFrom}`,
          status: 'Open',
          severity: severity,
          assignee: 'AI System',
          created: new Date(attack.timestamp),
          description: `Real-time threat detected. Source: ${attack.sourceCountry}, Target: ${attack.destinationCountry} (${attack.ipTo}).`,
          affectedAssets: ['Firewall-Edge'],
          timeline: [{
            action: 'Detected',
            user: 'IDS',
            timestamp: new Date(attack.timestamp)
          }]
        };

        setIncidents(prev => {
          const updated = [newIncident, ...prev];
          return updated.slice(0, 50); // Keep incidents list from growing indefinitely
        });
      });

      return () => {
        socket.off('attack_event');
        socket.disconnect();
      };
    });
  }, []);

  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    open: incidents.filter((i) => i.status.toLowerCase() === 'open').length,
    investigating: incidents.filter((i) => i.status.toLowerCase() === 'investigating').length,
    resolved: incidents.filter((i) => i.status.toLowerCase() === 'resolved').length,
    critical: incidents.filter((i) => i.severity.toLowerCase() === 'critical').length,
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  <Input
                    placeholder="Incident title..."
                    className="mt-1"
                    value={newIncidentData.title}
                    onChange={(e) => setNewIncidentData({ ...newIncidentData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe the incident..."
                    className="mt-1"
                    rows={4}
                    value={newIncidentData.description}
                    onChange={(e) => setNewIncidentData({ ...newIncidentData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <select
                      className="w-full mt-1 bg-background border border-input rounded-md px-3 py-2 text-sm"
                      value={newIncidentData.severity}
                      onChange={(e) => setNewIncidentData({ ...newIncidentData, severity: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateIncident}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Incident'}
                </Button>
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
                      const statusKey = incident.status.toLowerCase() as keyof typeof statusStyles;
                      const severityKey = incident.severity.toLowerCase() as keyof typeof severityStyles;
                      const StatusIcon = statusStyles[statusKey]?.icon || AlertTriangle;

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
                              className={cn('h-5 w-5 mt-0.5', statusStyles[statusKey]?.text)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{incident.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  className={cn(
                                    'text-[10px]',
                                    severityStyles[severityKey]?.bg,
                                    severityStyles[severityKey]?.text
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
                            severityStyles[selectedIncident.severity.toLowerCase() as keyof typeof severityStyles]?.bg,
                            severityStyles[selectedIncident.severity.toLowerCase() as keyof typeof severityStyles]?.text,
                            severityStyles[selectedIncident.severity.toLowerCase() as keyof typeof severityStyles]?.border
                          )}
                        >
                          {selectedIncident.severity}
                        </Badge>
                        <Badge
                          className={cn(
                            'capitalize',
                            statusStyles[selectedIncident.status.toLowerCase() as keyof typeof statusStyles]?.bg,
                            statusStyles[selectedIncident.status.toLowerCase() as keyof typeof statusStyles]?.text
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
                      <p className="font-medium">{selectedIncident.created.toLocaleString()}</p>
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
                            {event.note && (
                              <div className="mt-2 p-2 rounded bg-muted/50 text-xs border border-border/50">
                                {event.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="flex-1" disabled={isSubmitting}>
                          Update Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="soc-card min-w-[160px]">
                        <DropdownMenuItem onClick={() => handleUpdateStatus('Open')}>
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus('Investigating')}>
                          Investigating
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus('Resolved')}>
                          Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus('Closed')}>
                          Closed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1" disabled={isSubmitting}>
                          Add Note
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="soc-card">
                        <DialogHeader>
                          <DialogTitle>Add Note</DialogTitle>
                          <DialogDescription>
                            Add a comment or update to the incident timeline
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Textarea
                            placeholder="Type your note here..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={4}
                          />
                          <Button
                            className="w-full"
                            onClick={handleAddNote}
                            disabled={isSubmitting || !noteText}
                          >
                            {isSubmitting ? 'Saving...' : 'Save Note'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
