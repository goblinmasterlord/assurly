import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { HomePage } from "@/pages/Home";
import { AssessmentsPage } from "@/pages/Assessments";
import { AssessmentDetailPage } from "@/pages/AssessmentDetail";
import { Toaster } from "@/components/ui/toaster";
import { useUser } from "@/contexts/UserContext";

function AppContent() {
  const { isLoading } = useUser();
  
  // Show nothing while loading role from localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="assessments/:id" element={<AssessmentDetailPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
