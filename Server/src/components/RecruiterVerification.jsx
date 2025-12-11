import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  MenuItem,
} from "@mui/material";
import api from "../api/api";

const RecruiterVerification = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    company_name: "",
    company_website: "",
    verification_documents: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const steps = ["Company Information", "Document Upload"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      verification_documents: e.target.files[0],
    }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
    setMessage({ type: "", text: "" });
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = new FormData();
      data.append("company_name", formData.company_name);
      data.append("company_website", formData.company_website);
      if (formData.verification_documents) {
        data.append("verification_documents", formData.verification_documents);
      }

      // FIXED: Correct endpoint with trailing slash
      const res = await api.post("/accounts/recruiter-verification/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({
        type: "success",
        text: res.data.message || "Verification submitted successfully!",
      });
      setFormData({
        company_name: "",
        company_website: "",
        verification_documents: null,
      });
      setActiveStep(0);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Verification failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Company Name"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Company Website"
              name="company_website"
              value={formData.company_website}
              onChange={handleInputChange}
              type="url"
              fullWidth
              placeholder="https://example.com"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Upload verification document (Company ID, Business Card, or Official Letter)
            </Typography>
            <Button variant="outlined" component="label">
              Select Document
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />
            </Button>
            {formData.verification_documents && (
              <Typography variant="body2">
                Selected: {formData.verification_documents.name}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Recruiter Verification
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Complete your verification to access all recruiter features
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !formData.verification_documents}
                color="primary"
              >
                {loading ? "Submitting..." : "Submit Verification"}
              </Button>
            ) : (
              <Button onClick={handleNext} variant="contained">
                Next
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, color: "text.secondary" }}>
          Your verification will be reviewed within 24-48 hours. You'll receive
          an email notification once your account is verified.
        </Typography>
      </Paper>
    </Container>
  );
};

export default RecruiterVerification;