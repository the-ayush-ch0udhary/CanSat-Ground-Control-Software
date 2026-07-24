import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import LoadingScreen from "@/components/LoadingScreen";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === null) return <LoadingScreen />;
  if (user === false) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user } = useAuth();
  if (user === null) return <LoadingScreen />;
  if (user && user !== false) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App dark">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <Login />
                </PublicOnly>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#131b2b",
              border: "1px solid rgba(0,240,255,0.25)",
              color: "#f3f4f6",
              fontFamily: "Inter",
            },
          }}
        />
      </AuthProvider>
    </div>
  );
}

export default App;
