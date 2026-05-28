import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import SetupProfile from "@/pages/SetupProfile";
import AddCard from "@/pages/AddCard";
import Dashboard from "@/pages/Dashboard";
import Cards from "@/pages/Cards";
import Stake from "@/pages/Stake";
import Deposit from "@/pages/Deposit";
import Withdraw from "@/pages/Withdraw";
import Transactions from "@/pages/Transactions";
import Settings from "@/pages/Settings";
import Referrals from "@/pages/Referrals";
import Exchange from "@/pages/Exchange";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/setup-profile" component={SetupProfile} />
      <Route path="/add-card" component={AddCard} />

      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/cards">
        <ProtectedRoute><Cards /></ProtectedRoute>
      </Route>
      <Route path="/stake">
        <ProtectedRoute><Stake /></ProtectedRoute>
      </Route>
      <Route path="/deposit">
        <ProtectedRoute><Deposit /></ProtectedRoute>
      </Route>
      <Route path="/withdraw">
        <ProtectedRoute><Withdraw /></ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute><Transactions /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>
      <Route path="/referrals">
        <ProtectedRoute><Referrals /></ProtectedRoute>
      </Route>
      <Route path="/exchange">
        <ProtectedRoute><Exchange /></ProtectedRoute>
      </Route>

      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
