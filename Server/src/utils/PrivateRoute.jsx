import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api"; // Use your API utility instead of axios directly

const PrivateRoute = ({ children, role }) => {
  const [isVerified, setIsVerified] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");
  const userRole = localStorage.getItem("role");

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setIsVerified(false);
        setLoading(false);
        return;
      }

      // Check recruiter verification status if needed
      if (role === "recruiter" && userRole === "recruiter") {
        try {
          const res = await api.get("/accounts/verification-status/");
          setIsVerified(res.data.status !== 'not_submitted');
        } catch (err) {
          setIsVerified(false);
        }
      } else {
        setIsVerified(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, [role, token, userRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  // For recruiters, check if they're verified
  if (role === "recruiter" && !isVerified) {
    return <Navigate to="/recruiter-verification" replace />;
  }

  return children;
};

export default PrivateRoute;