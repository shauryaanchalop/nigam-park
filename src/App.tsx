import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AccessibilityProvider } from "@/components/ui/AccessibilityWrapper";
import { MobileNav } from "@/components/ui/MobileNav";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminParkingLots from "./pages/AdminParkingLots";
import AdminFines from "./pages/AdminFines";
import MyReservations from "./pages/MyReservations";
import ParkingHistory from "./pages/ParkingHistory";
import VisionDashboard from "./pages/VisionDashboard";
import FraudHunter from "./pages/FraudHunter";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ShiftScheduling from "./pages/ShiftScheduling";
import LoyaltyProgram from "./pages/LoyaltyProgram";
import LiveParkingMap from "./pages/LiveParkingMap";
import KioskMode from "./pages/KioskMode";
import AttendantPerformance from "./pages/AttendantPerformance";
import NotificationPreferences from "./pages/NotificationPreferences";
import RealTimeAnalytics from "./pages/RealTimeAnalytics";
import ReportViolation from "./pages/ReportViolation";
import LotDetails from "./pages/LotDetails";
import AdminViolations from "./pages/AdminViolations";
import AttendantCheckIn from "./pages/AttendantCheckIn";
import CitizenPortal from "./pages/CitizenPortal";
import ZoneParkingPage from "./pages/ZoneParkingPage";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/citizen" element={<CitizenPortal />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin/users" element={<AdminUserManagement />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/parking-lots" element={<AdminParkingLots />} />
                  <Route path="/admin/fines" element={<AdminFines />} />
                  <Route path="/admin/shifts" element={<ShiftScheduling />} />
                  <Route path="/my-reservations" element={<MyReservations />} />
                  <Route path="/parking-history" element={<ParkingHistory />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/vision-dashboard" element={<VisionDashboard />} />
                  <Route path="/fraud-hunter" element={<FraudHunter />} />
                  <Route path="/loyalty" element={<LoyaltyProgram />} />
                  <Route path="/live-map" element={<LiveParkingMap />} />
                  <Route path="/kiosk" element={<KioskMode />} />
                  <Route path="/attendant/performance" element={<AttendantPerformance />} />
                  <Route path="/notifications" element={<NotificationPreferences />} />
                  <Route path="/admin/realtime" element={<RealTimeAnalytics />} />
                  <Route path="/report-violation" element={<ReportViolation />} />
                  <Route path="/lot/:lotId" element={<LotDetails />} />
                  <Route path="/parking/:zoneSlug" element={<ZoneParkingPage />} />
                  <Route path="/blog" element={<BlogIndex />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/admin/violations" element={<AdminViolations />} />
                  <Route path="/attendant/checkin" element={<AttendantCheckIn />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <MobileNav />
            </BrowserRouter>
          </AuthProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
