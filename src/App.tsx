import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import LandingV2 from "./pages/LandingV2";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import FighterSignup from "./pages/FighterSignup";
import Dashboard from "./pages/Dashboard";
import FighterStorefront from "./pages/FighterStorefront";
import ProductDetail from "./pages/ProductDetail";
import FighterProductDetail from "./pages/FighterProductDetail";
import Marketplace from "./pages/Marketplace";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFighters from "./pages/admin/AdminFighters";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminAssignments from "./pages/admin/AdminAssignments";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSales from "./pages/admin/AdminSales";
import AdminCommissions from "./pages/admin/AdminCommissions";
import AdminProductRequests from "./pages/admin/AdminProductRequests";
import AdminSovrn from "./pages/admin/AdminSovrn";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingV2 />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/fighter-signup" element={<FighterSignup />} />
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
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
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
              path="/admin/brands"
              element={
                <AdminRoute>
                  <AdminBrands />
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
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/sales"
              element={
                <AdminRoute>
                  <AdminSales />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/commissions"
              element={
                <AdminRoute>
                  <AdminCommissions />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/product-requests"
              element={
                <AdminRoute>
                  <AdminProductRequests />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/sovrn"
              element={
                <AdminRoute>
                  <AdminSovrn />
                </AdminRoute>
              }
            />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            {/* Fighter Directory - Coming Soon */}
            <Route path="/fighter-directory" element={<ComingSoon />} />
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
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
