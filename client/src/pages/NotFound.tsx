import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const NotFound = () => {
    const location = useLocation();

    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background grid-pattern p-4">
            <div className="text-center soc-card max-w-sm w-full py-12">
                <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-6 opacity-80" />
                <h1 className="mb-2 text-6xl font-extrabold gradient-text">404</h1>
                <p className="mb-8 text-xl text-muted-foreground">Oops! Page not found</p>
                <Link to="/">
                    <Button variant="outline" className="w-full">
                        Return to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
