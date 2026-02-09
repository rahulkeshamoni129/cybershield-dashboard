import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  QrCode,
  Camera,
  Link,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Scan,
  Upload,
  Globe,
} from 'lucide-react';

interface ScanResult {
  url: string;
  isSafe: boolean;
  riskScore: number;
  threats: string[];
  domain: string;
  ssl: boolean;
  redirects: number;
  malwareDetected: boolean;
  phishingDetected: boolean;
  scannedAt: Date;
}

const mockScanURL = (url: string): ScanResult => {
  const isMalicious = Math.random() > 0.7;
  const domain = url.includes('://') ? url.split('/')[2] : url.split('/')[0];

  return {
    url,
    isSafe: !isMalicious,
    riskScore: isMalicious ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 20),
    threats: isMalicious
      ? ['Phishing', 'Malware Distribution', 'Suspicious Redirect'].slice(0, Math.floor(Math.random() * 3) + 1)
      : [],
    domain,
    ssl: url.startsWith('https'),
    redirects: Math.floor(Math.random() * 3),
    malwareDetected: isMalicious && Math.random() > 0.5,
    phishingDetected: isMalicious && Math.random() > 0.5,
    scannedAt: new Date(),
  };
};

const QRScan = () => {
  const { token } = useAuth();
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanURL = async () => {
    if (!urlInput.trim()) return;

    setIsScanning(true);

    try {
      const res = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: urlInput })
      });

      const data = await res.json();

      if (res.ok) {
        const scanData = data.data;

        const newResult: ScanResult = {
          url: scanData.url,
          isSafe: scanData.status === 'Clean',
          riskScore: scanData.score * 10, // Scale 0-10 to 0-100
          threats: scanData.threatType !== 'None' ? [scanData.threatType] : [],
          domain: (scanData.url.startsWith('http') || scanData.url.startsWith('https'))
            ? new URL(scanData.url).hostname
            : 'Raw Data',
          ssl: scanData.url.startsWith('https'),
          redirects: 0,
          malwareDetected: scanData.status === 'Malicious',
          phishingDetected: scanData.threatType.includes('Phishing'),
          scannedAt: new Date(scanData.scannedAt),
        };

        setResult(newResult);
        setScanHistory((prev) => [newResult, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error("Scan Error", error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsScanning(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        try {
          // Call Real Backend API
          const res = await fetch('/api/qr/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ image: base64Image }) // Send Base64
          });

          const data = await res.json();

          if (res.ok) {
            const scanData = data.data;

            const newResult: ScanResult = {
              url: scanData.url,
              isSafe: scanData.status === 'Clean',
              riskScore: scanData.score * 10,
              threats: scanData.threatType !== 'None' ? [scanData.threatType] : [],
              domain: (scanData.url.startsWith('http') || scanData.url.startsWith('https'))
                ? new URL(scanData.url).hostname
                : 'Raw Data',
              ssl: scanData.url.startsWith('https'),
              redirects: 0,
              malwareDetected: scanData.status === 'Malicious',
              phishingDetected: scanData.threatType.includes('Phishing') || scanData.threatType.includes('Malware'),
              scannedAt: new Date(scanData.scannedAt),
            };

            setResult(newResult);
            setScanHistory((prev) => [newResult, ...prev.slice(0, 9)]);
          } else {
            console.error('Scan Failed:', data.message);
            // Fallback to error state display in UI? Or Toast
          }

        } catch (error) {
          console.error('Upload Error:', error);
        } finally {
          setIsScanning(false);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">QR/Barcode Safety Scanner</h1>
          <p className="text-muted-foreground mt-1">
            Scan QR codes and URLs for malware, phishing, and other threats
          </p>
        </div>

        {/* Scanner Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload / Input */}
          <Card className="soc-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Scan QR Code or URL
              </CardTitle>
              <CardDescription>
                Upload a QR code image or enter a URL to check for safety
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Zone */}
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  isScanning && 'animate-pulse'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"

                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-primary/10">
                    {isScanning ? (
                      <Scan className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {isScanning ? 'Scanning...' : 'Upload QR Code Image'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click or drag and drop
                    </p>
                  </div>
                </div>
              </div>

              {/* URL Input */}
              <div className="relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-full bg-border" />
                <span className="relative bg-card px-4 text-sm text-muted-foreground">
                  or enter URL directly
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://example.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && scanURL()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={scanURL} disabled={isScanning || !urlInput.trim()}>
                  <Scan className={cn('h-4 w-4', isScanning && 'animate-spin')} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          <Card className={cn(
            'soc-card transition-all',
            result && (result.isSafe ? 'border-accent/50' : 'border-destructive/50')
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Scan Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Status Banner */}
                  <div
                    className={cn(
                      'p-4 rounded-lg flex items-center gap-3',
                      result.isSafe
                        ? 'bg-accent/10 border border-accent/30'
                        : 'bg-destructive/10 border border-destructive/30'
                    )}
                  >
                    {result.isSafe ? (
                      <CheckCircle className="h-8 w-8 text-accent" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                    )}
                    <div>
                      <p className={cn(
                        'font-bold text-lg',
                        result.isSafe ? 'text-accent' : 'text-destructive'
                      )}>
                        {result.isSafe ? 'URL is Safe' : 'Threat Detected!'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Risk Score: {result.riskScore}/100
                      </p>
                    </div>
                  </div>

                  {/* URL Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">URL</span>
                      <div className="flex items-center gap-2 font-mono text-xs max-w-[200px] truncate">
                        <Globe className="h-3 w-3" />
                        {result.url}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Domain</span>
                      <span className="font-mono">{result.domain}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">SSL</span>
                      <Badge className={cn(
                        result.ssl
                          ? 'bg-accent/20 text-accent'
                          : 'bg-warning/20 text-warning'
                      )}>
                        {result.ssl ? 'Secure' : 'Not Secure'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Redirects</span>
                      <span>{result.redirects}</span>
                    </div>
                  </div>

                  {/* Threats */}
                  {result.threats.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-2">Detected Threats</p>
                      <div className="flex flex-wrap gap-2">
                        {result.threats.map((threat) => (
                          <Badge key={threat} className="bg-destructive/20 text-destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            {threat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(result.url, '_blank')}
                      disabled={!result.isSafe}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open URL
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setResult(null)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Scan a QR code or enter a URL to check for safety</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <Card className="soc-card">
            <CardHeader>
              <CardTitle className="text-lg">Scan History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {scanHistory.map((scan, index) => (
                  <div
                    key={`${scan.url}-${index}`}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]',
                      scan.isSafe
                        ? 'bg-accent/5 border-accent/20 hover:border-accent/50'
                        : 'bg-destructive/5 border-destructive/20 hover:border-destructive/50'
                    )}
                    onClick={() => setResult(scan)}
                  >
                    <div className="flex items-center gap-2">
                      {scan.isSafe ? (
                        <CheckCircle className="h-4 w-4 text-accent" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-mono text-xs truncate flex-1">
                        {scan.domain}
                      </span>
                      <Badge className="text-[10px]" variant="outline">
                        {scan.riskScore}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {scan.scannedAt.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default QRScan;
