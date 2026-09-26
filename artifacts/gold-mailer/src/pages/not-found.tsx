import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { user } = useAuth();
  const targetHome = user ? "/dashboard" : "/";
  const buttonLabel = user ? "Return to Dashboard" : "Return to Home";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <p className="text-8xl font-black text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={targetHome}>
            <Button className="w-full sm:w-auto bg-primary text-black font-extrabold hover:bg-primary/90 gap-2">
              <Home size={16} /> {buttonLabel}
            </Button>
          </Link>
          {user && (
            <Link href="/profile">
              <Button variant="outline" className="w-full sm:w-auto border-border hover:border-primary/50 gap-2">
                Social Accounts
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
