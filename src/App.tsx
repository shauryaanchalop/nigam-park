import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MobileNav } from "@/components/ui/MobileNav";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminParkingLots from "./pages/AdminParkingLots";
import MyReservations from "./pages/MyReservations";
import ParkingHistory from "./pages/ParkingHistory";
import VisionDashboard from "./pages/VisionDashboard";
import FraudHunter from "./pages/FraudHunter";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin/users" element={<AdminUserManagement />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/parking-lots" element={<AdminParkingLots />} />
              <Route path="/my-reservations" element={<MyReservations />} />
              <Route path="/parking-history" element={<ParkingHistory />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/vision-dashboard" element={<VisionDashboard />} />
              <Route path="/fraud-hunter" element={<FraudHunter />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <MobileNav />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
