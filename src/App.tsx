import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import FighterSignup from "./pages/FighterSignup";
import Dashboard from "./pages/Dashboard";
import FighterStorefront from "./pages/FighterStorefront";
import ProductDetail from "./pages/ProductDetail";
import FighterProductDetail from "./pages/FighterProductDetail";
import AdminFighters from "./pages/admin/AdminFighters";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAssignments from "./pages/admin/AdminAssignments";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AdminSetup from "./pages/AdminSetup";
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
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/fighter-signup" element={<FighterSignup />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Product detail route */}
            <Route path="/p/:slug" element={<ProductDetail />} />
            {/* Admin routes */}
            <Route path="/admin" element={<Navigate to="/admin/fighters" replace />} />
            <Route
              path="/admin/fighters"
              element={
                <AdminRoute>
                  <AdminFighters />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/assignments"
              element={
                <AdminRoute>
                  <AdminAssignments />
                </AdminRoute>
              }
            />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            {/* Fighter product detail - must be before /:handle */}
            <Route path="/:handle/:productSlug" element={<FighterProductDetail />} />
            {/* Fighter storefront - must be last dynamic route */}
            <Route path="/:handle" element={<FighterStorefront />} />
            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
