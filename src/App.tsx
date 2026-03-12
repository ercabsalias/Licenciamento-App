import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import ProdutosPage from "./pages/ProdutosPage";
import ProdutoPage from "./pages/ProdutoPage";
import NotFound from "./pages/NotFound";
import { apiClient } from "./services/api/client";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  // when the app boots we read any saved token and set it in the client
  const existingToken = localStorage.getItem('auth_token');
  if (existingToken) {
    // set the token synchronously using our shared client
    apiClient.setToken(existingToken);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/licenciamento" replace />} />
            <Route path="licenciamento" element={<ProdutosPage />} />
            <Route path="produto" element={<ProdutoPage />} />
            {/* catch-all under /app */}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};
export default App;
