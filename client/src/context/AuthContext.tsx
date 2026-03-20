import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// Define User Interface
export interface User {
    _id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    department?: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-state-changed'));
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            try {
                const payload = JSON.parse(atob(storedToken.split('.')[1]));
                const expirationDate = payload.exp * 1000;
                
                if (Date.now() >= expirationDate) {
                    logout();
                } else {
                    const parsedUser = JSON.parse(storedUser);
                    setUser({ ...parsedUser, token: storedToken });
                    
                    const timeout = expirationDate - Date.now();
                    setTimeout(() => {
                        toast({
                            title: "Session Expired",
                            description: "Your session has timed out. Please log in again.",
                            variant: "destructive"
                        });
                        logout();
                    }, timeout);
                }
            } catch (e) {
                console.error("Failed to restore session", e);
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const handleUnauthorized = () => {
            if (user) {
                toast({
                    title: "Session Expired",
                    description: "Your session is no longer valid. Please log in again.",
                    variant: "destructive"
                });
                logout();
            }
        };

        window.addEventListener('auth-unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
    }, [user, toast]);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);
        window.dispatchEvent(new Event('auth-state-changed'));
        
        try {
            const payload = JSON.parse(atob(userData.token.split('.')[1]));
            const timeout = (payload.exp * 1000) - Date.now();
            if (timeout > 0) {
                setTimeout(() => {
                    toast({
                        title: "Session Expired",
                        description: "Your session has expired. Please log in again.",
                        variant: "destructive"
                    });
                    logout();
                }, timeout);
            }
        } catch (e) {}
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            updateUser,
            isAuthenticated,
            isAdmin,
            token: user?.token || null
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
