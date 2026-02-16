import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * BackendStatus Component
 * 
 * Automatically handles waking up a Render backend on site load.
 * Displays connection status with retry logic and clean UI.
 */
const BackendStatus: React.FC = () => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [retryCount, setRetryCount] = useState(0);
    const [lastResponse, setLastResponse] = useState<Date | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'https://cybershield-api-fr7x.onrender.com';

    useEffect(() => {
        let isMounted = true;
        let retryTimer: NodeJS.Timeout;

        const checkConnection = async () => {
            try {
                // Render cold starts can take up to 90s, so we use a relatively long timeout for the fetch itself
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(`${API_URL}/api/health`, {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    if (isMounted) {
                        setStatus('connected');
                        setLastResponse(new Date());
                    }
                } else {
                    throw new Error('Server responded with error');
                }
            } catch (error) {
                if (isMounted) {
                    setStatus('connecting');
                    setRetryCount(prev => prev + 1);
                    // Retry every 3 seconds while connecting/waking up
                    retryTimer = setTimeout(checkConnection, 3000);
                }
            }
        };

        checkConnection();

        return () => {
            isMounted = false;
            if (retryTimer) clearTimeout(retryTimer);
        };
    }, [API_URL]);

    // If it's been taking too long (e.g. > 120s), show a more definitive error
    useEffect(() => {
        if (retryCount > 40 && status === 'connecting') {
            setStatus('error');
        }
    }, [retryCount, status]);

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-500",
            status === 'connecting' && "bg-amber-500/10 border-amber-500/30 text-amber-500",
            status === 'connected' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
            status === 'error' && "bg-rose-500/10 border-rose-500/30 text-rose-500"
        )}>
            {status === 'connecting' && (
                <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-xs font-medium animate-pulse">Connecting to server...</span>
                </>
            )}

            {status === 'connected' && (
                <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Backend connected</span>
                </>
            )}

            {status === 'error' && (
                <>
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Backend not connected</span>
                </>
            )}

            {/* Minimalist icon only for mobile if needed, or just keep the text */}
            <div className="ml-1 opacity-50">
                {status === 'connected' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            </div>
        </div>
    );
};

export default BackendStatus;
