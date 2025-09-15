// App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import GameDetail from "./pages/GameDetail";
import Dashboard from "./pages/Dashboard";
import AddGame from "./pages/AddGame";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/game/:id" element={<GameDetail />} />
            <Route path="/companies" element={<div>Companies Page (Coming Soon)</div>} />
            
            {/* Auth routes - redirect if already logged in */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/add-game" 
              element={
                <ProtectedRoute>
                  <AddGame />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/projects" 
              element={
                <ProtectedRoute>
                  <div>Projects Page (Coming Soon)</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/settings" 
              element={
                <ProtectedRoute>
                  <div>Settings Page (Coming Soon)</div>
                </ProtectedRoute>
              } 
            />
            
            {/* Unauthorized page */}
            <Route 
              path="/unauthorized" 
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
                    <p className="text-muted-foreground mb-4">
                      У вас нет прав для просмотра этой страницы
                    </p>
                    <a href="/" className="text-primary hover:underline">
                      Вернуться на главную
                    </a>
                  </div>
                </div>
              } 
            />
            
            {/* 404 - Keep this last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;