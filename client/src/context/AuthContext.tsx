import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

    useEffect(() => {
        // Check localStorage on mount
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // Optionally verify token validity here or wait for 401
                setUser({ ...parsedUser, token: storedToken });
            } catch (e) {
                console.error("Failed to parse user from storage", e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            updateUser, // Added updateUser to the context value
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
