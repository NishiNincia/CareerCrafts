import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import api from "../api/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // FIXED: Added trailing slash
      await api.post("/accounts/forgot-password/", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Error sending reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 6 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Forgot Password
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!sent ? (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Send Reset Link"}
            </Button>
          </Box>
        ) : (
          <Alert severity="success" sx={{ mt: 2 }}>
            Reset link sent to your email! Please check your inbox.
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;