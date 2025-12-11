import React from "react";
import { Container, Paper, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 6, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          You don't have permission to access this page.
        </Typography>
        <Box>
          <Button variant="contained" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            Go Back
          </Button>
          <Button variant="outlined" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Unauthorized;