import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated, user } = useAuth();

    // We might want to add a loading state check here if auth restoration is async
    // But based on current AuthContext, it tries to load synchronously from localStorage on mount.
    // However, `useEffect` runs after render, so `user` might be null initially even if token exists in storage.
    // Let's modify AuthContext slightly or just accept that it might flash login briefly or we can check token directly from storage for the initial render.

    // A safer approach for this specific AuthContext structure:
    // Since `user` is null initially until useEffect runs, but we want to prevent redirecting if we *might* differ checking.
    // Actually, let's just check `isAuthenticated` which comes from `!!user`.

    // Improvement: We can check localStorage directly here for a quick check to avoid flash, 
    // or better, rely on the AuthContext state if it was initialized.

    // For now, let's trust the AuthProvider. If user is null, they are not authenticated.

    // Wait, if we refresh, `user` is null for one render cycle until `useEffect` in AuthProvider runs.
    // We should fix AuthProvider to initialize lazy state if possible, or add an `isLoading` to it.
    // But to specific request:

    if (!isAuthenticated && !localStorage.getItem('token')) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
