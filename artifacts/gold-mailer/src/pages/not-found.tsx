import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-8xl font-black text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">The page you are looking for does not exist.</p>
        <Link href="/">
          <Button className="bg-primary text-primary-foreground hover:opacity-90">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
