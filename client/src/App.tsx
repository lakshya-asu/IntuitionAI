import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Curriculum from "@/pages/Curriculum";
import Library from "@/pages/Library";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Calendar from "@/pages/Calendar";
import Assessment from "@/pages/Assessment";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

import PageTransition from "@/components/layout/PageTransition";

// Higher order component for animated routes
const AnimatedRoute = ({ component: Component, ...rest }: any) => {
  return (
    <Route {...rest}>
      {(params) => (
        <PageTransition>
          <Component {...params} />
        </PageTransition>
      )}
    </Route>
  );
};

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          if (window.location.pathname !== '/login') {
            setLocation('/login');
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  if (isAuthenticated === null) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      <AnimatedRoute path="/login" component={Login} />
      <AnimatedRoute path="/" component={Dashboard} />
      <AnimatedRoute path="/curriculum" component={Curriculum} />
      <AnimatedRoute path="/library" component={Library} />
      <AnimatedRoute path="/analytics" component={Analytics} />
      <AnimatedRoute path="/settings" component={Settings} />
      <AnimatedRoute path="/calendar" component={Calendar} />
      <AnimatedRoute path="/assessment/:id" component={Assessment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id.apps.googleusercontent.com";
  
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={clientId}>
        <Router />
        <Toaster />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
