import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import { useNotificationPoller } from "@/hooks/useNotifications";
import { PopunderAd } from "@/components/PopunderAd";
import { NavigationLoader } from "@/components/NavigationLoader";

import AdminLogin from "@/pages/AdminLogin";
import MarketplaceHome from "@/pages/MarketplaceHome";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import SetupProfile from "@/pages/SetupProfile";
import Dashboard from "@/pages/Dashboard";
import Deposit from "@/pages/Deposit";
import Withdraw from "@/pages/Withdraw";
import Transactions from "@/pages/Transactions";
import Settings from "@/pages/Settings";
import Referrals from "@/pages/Referrals";
import Exchange from "@/pages/Exchange";
import Crypto from "@/pages/Crypto";
import Admin from "@/pages/Admin";
import Marketplace from "@/pages/Marketplace";
import PostTask from "@/pages/PostTask";
import Submissions from "@/pages/Submissions";
import Inbox from "@/pages/Inbox";
import NotFound from "@/pages/not-found";
import { Privacy, Terms } from "@/pages/Legal";
import About from "@/pages/About";

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
      <Route path="/" component={MarketplaceHome} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/setup-profile" component={SetupProfile} />

      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
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
      <Route path="/crypto">
        <ProtectedRoute><Crypto /></ProtectedRoute>
      </Route>

      <Route path="/tasks">
        <ProtectedRoute><Marketplace /></ProtectedRoute>
      </Route>
      <Route path="/post-task">
        <ProtectedRoute><PostTask /></ProtectedRoute>
      </Route>
      <Route path="/submissions">
        <ProtectedRoute><Submissions /></ProtectedRoute>
      </Route>
      <Route path="/inbox">
        <ProtectedRoute><Inbox /></ProtectedRoute>
      </Route>
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/about" component={About} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin">
        <AdminRoute><Admin /></AdminRoute>
      </Route>
      <Route path="/admin/:subpath*">
        <AdminRoute><Admin /></AdminRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function NotificationPollerMount() {
  useNotificationPoller();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <NotificationPollerMount />
            <PopunderAd />
            <NavigationLoader />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
