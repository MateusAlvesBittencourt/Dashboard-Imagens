import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import DataManagement from "./pages/DataManagement";
import Login from "./pages/Login";
import { useAuth } from "./_core/hooks/useAuth";
import { isLocalMode } from "./lib/env";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  if (loading) return null;
  if (isLocalMode() && !isAuthenticated) return null; // fará redirect via useAuth
  // @ts-ignore
  return <Component/>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/data-management" component={() => <ProtectedRoute component={DataManagement} />} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
