import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Package2 } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) setError("Invalid username or password. Please try again.");
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-accent/20 border border-accent/40">
            <Package2 className="w-9 h-9 text-accent" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
              LS Group
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Inventory Management System
            </p>
          </div>
        </div>

        <Card className="border border-border shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-center text-foreground">
              Sign in to your account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-ocid="login.input"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  data-ocid="login.input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && (
                <p
                  data-ocid="login.error_state"
                  className="text-sm text-destructive text-center"
                >
                  {error}
                </p>
              )}
              <Button
                data-ocid="login.submit_button"
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} LS Group · Arhar Daal Manufacturing
        </p>
      </div>
    </div>
  );
}
