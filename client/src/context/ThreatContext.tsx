import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io } from 'socket.io-client';
import { Threat, generateThreats } from '@/data/mockData';

interface ThreatContextType {
    threats: Threat[];
    refreshThreats: () => void;
    isLoading: boolean;
}

const ThreatContext = createContext<ThreatContextType | undefined>(undefined);

export const ThreatProvider = ({ children }: { children: ReactNode }) => {
    // Initialize state from LocalStorage or Default
    const [threats, setThreats] = useState<Threat[]>(() => {
        try {
            const stored = localStorage.getItem('threat_feed_data');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Important: Convert string timestamps back to Date objects
                return parsed.map((t: any) => ({
                    ...t,
                    timestamp: new Date(t.timestamp),
                    dataSource: t.dataSource || 'Simulation' // Migration for old data
                }));
            }
        } catch (error) {
            console.error('Failed to load threats from storage', error);
        }
        // distinct initial set
        return generateThreats(10);
    });

    const [isLoading, setIsLoading] = useState(false);

    // Persistence Effect
    useEffect(() => {
        localStorage.setItem('threat_feed_data', JSON.stringify(threats));
    }, [threats]);

    // Listen for real-time updates via Socket.IO
    useEffect(() => {
        const socket = io('/', {
            path: '/socket.io',
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('ThreatFeed Socket Connected');
        });

        socket.on('attack_event', (attack: any) => {
            const newThreat: Threat = {
                id: `threat-${attack.id}-${Date.now()}`,
                type: attack.attackType,
                severity: attack.severity,
                status: 'active',
                sourceCountry: attack.sourceCountry,
                targetCountry: attack.destinationCountry,
                sourceLat: 0,
                sourceLng: 0,
                targetLat: 0,
                targetLng: 0,
                source: {
                    ip: attack.ipFrom,
                    country: attack.sourceCountry,
                    lat: 0,
                    lng: 0
                },
                target: {
                    ip: attack.ipTo,
                    country: attack.destinationCountry,
                    lat: 0,
                    lng: 0
                },
                mitreTactic: 'Initial Access',
                mitreId: 'T1078',
                timestamp: new Date(attack.timestamp),
                dataSource: attack.dataSource || attack.details?.dataSource || 'Simulation'
            };

            // Append new threat to the top, keep max 100
            setThreats(prev => [newThreat, ...prev].slice(0, 100));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const refreshThreats = () => {
        setIsLoading(true);
        setTimeout(() => {
            // Add a few more randoms on manual refresh if desired, or just sync
            setThreats(prev => [...generateThreats(2), ...prev].slice(0, 100));
            setIsLoading(false);
        }, 800);
    };

    return (
        <ThreatContext.Provider value={{ threats, refreshThreats, isLoading }}>
            {children}
        </ThreatContext.Provider>
    );
};

export const useThreatContext = () => {
    const context = useContext(ThreatContext);
    if (context === undefined) {
        throw new Error('useThreatContext must be used within a ThreatProvider');
    }
    return context;
};
