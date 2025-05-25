import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from './providers/ThemeProvider';
import CommandPaletteProvider from './components/commandPalette/CommandPaletteProvider';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Compose from "./pages/Compose";
import ViewEmail from "./pages/ViewEmail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AIEmailTools from "./pages/AIEmailTools";
import Templates from "./pages/Templates";
import ScheduledEmails from "./pages/ScheduledEmails";
import FollowUps from "./pages/FollowUps";
import TrackedEmails from "./pages/TrackedEmails";
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
      <HelmetProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <CommandPaletteProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/compose" element={<Compose />} />
                  <Route path="/email/:messageId" element={<ViewEmail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/ai-tools" element={<AIEmailTools />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/scheduled" element={<ScheduledEmails />} />
                  <Route path="/follow-ups" element={<FollowUps />} />
                  <Route path="/tracked" element={<TrackedEmails />} />
                    <Route path="/auth/callback/google" element={<GoogleAuthCallback />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </CommandPaletteProvider>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
};

export default App;
