// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline } from "@mui/material";

// Auth Pages - FIXED: Use consistent casing (change to match your actual folder structure)
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";

// Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";

// Components
import RecruiterVerification from "./components/RecruiterVerification";
import ResumeUpload from "./components/ResumeUpload";

// Utils
import PrivateRoute from "./utils/PrivateRoute";

// Environment variable check
if (!process.env.REACT_APP_API_URL) {
  console.error("REACT_APP_API_URL environment variable is not set");
}

function App() {
  return (
    <Router>
      <CssBaseline />

      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/employee/*"
          element={
            <PrivateRoute role="employee">
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/recruiter/*"
          element={
            <PrivateRoute role="recruiter">
              <RecruiterDashboard />
            </PrivateRoute>
          }
        />

        {/* Recruiter Verification */}
        <Route
          path="/recruiter-verification"
          element={
            <PrivateRoute role="recruiter">
              <RecruiterVerification />
            </PrivateRoute>
          }
        />

        {/* Resume Upload */}
        <Route
          path="/resume-upload"
          element={
            <PrivateRoute role="employee">
              <ResumeUpload />
            </PrivateRoute>
          }
        />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;