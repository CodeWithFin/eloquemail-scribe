import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from './providers/ThemeProvider';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Compose from "./pages/Compose";
import ViewEmail from "./pages/ViewEmail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AIEmailTools from "./pages/AIEmailTools";
import GoogleAuthCallback from "./components/auth/GoogleAuthCallback";

// Create a new QueryClient instance properly
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1
    }
  }
});

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/compose" element={<Compose />} />
                <Route path="/email/:messageId" element={<ViewEmail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/ai-tools" element={<AIEmailTools />} />
                <Route path="/auth/callback/google" element={<GoogleAuthCallback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
