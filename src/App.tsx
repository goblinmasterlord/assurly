import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { HomePage } from "@/pages/Home";
import { AssessmentsPage } from "@/pages/Assessments";
import { AssessmentDetailPage } from "@/pages/AssessmentDetail";
import { AnalyticsPage } from "@/pages/Analytics";
import { LandingPage } from "@/pages/Landing";
import { AboutPage } from "@/pages/About";
import { MissionPage } from "@/pages/Mission";
import { PricingPage } from "@/pages/Pricing";
import { SecurityPage } from "@/pages/Security";
import { TermsPage } from "@/pages/Terms";
import { DPAPage } from "@/pages/DPA";
import LoginPage from "@/pages/auth/Login";
import VerifyPage from "@/pages/auth/Verify";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function AppContent() {
  return (
    <>
      <Routes>
        {/* Public marketing routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/mission" element={<MissionPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/dpa" element={<DPAPage />} />
        </Route>

        {/* Public auth routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/verify" element={<VerifyPage />} />
        
        {/* Protected application routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <RootLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="assessments/:id" element={<AssessmentDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
        
        {/* Redirect any unknown routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
