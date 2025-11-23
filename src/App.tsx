import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { HomePage } from "@/pages/Home";
import { AssessmentsPage } from "@/pages/Assessments";
import { AssessmentDetailPage } from "@/pages/AssessmentDetail";
import { AnalyticsPage } from "@/pages/Analytics";
import StandardsManagement from "@/pages/admin/StandardsManagement";
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
        {/* Public auth routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/verify" element={<VerifyPage />} />

        {/* Protected application routes */}
        <Route
          path="/"
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
          <Route path="admin/standards" element={<StandardsManagement />} />
        </Route>

        {/* Redirect any unknown routes to home */}
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
