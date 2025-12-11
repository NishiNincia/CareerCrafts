import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import { Delete, CloudUpload } from "@mui/icons-material";
import api from "../api/api";

const ResumeUpload = ({ onAnalysisComplete }) => {
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadHistory, setUploadHistory] = useState([]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      
      if (!validTypes.includes(file.type)) {
        setMessage({
          type: "error",
          text: "Please upload a PDF, DOC, or DOCX file",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: "error",
          text: "File size must be less than 5MB",
        });
        return;
      }

      setResume(file);
      setMessage({ type: "", text: "" });
    }
  };

  const handleUpload = async () => {
    if (!resume) {
      setMessage({ type: "error", text: "Please select a resume file" });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("resume", resume);

      // FIXED: Correct endpoint with trailing slash
      const res = await api.post("/resumes/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMessage({
        type: "success",
        text: "Resume uploaded successfully!",
      });

      // Add to upload history
      setUploadHistory((prev) => [
        {
          filename: resume.name,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          id: Date.now(),
        },
        ...prev.slice(0, 4),
      ]);

      // Clear selected file
      setResume(null);

      // Pass analysis data to parent component
      if (onAnalysisComplete) {
        onAnalysisComplete({
          skills: res.data.skills || [],
          courses: res.data.courses || [],
          jobs: res.data.jobs || [],
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteHistory = (id) => {
    setUploadHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Upload Your Resume
        </Typography>

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Box
          sx={{
            border: "2px dashed",
            borderColor: "primary.main",
            borderRadius: 2,
            p: 3,
            textAlign: "center",
            mb: 3,
            backgroundColor: "grey.50",
          }}
        >
          <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            Drag & Drop your resume here
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or
          </Typography>

          <Button variant="contained" component="label">
            Browse Files
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </Button>

          {resume && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Selected: <strong>{resume.name}</strong>
              </Typography>
              <Typography variant="caption">
                Size: {(resume.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          )}

          <Typography variant="caption" display="block" sx={{ mt: 2 }}>
            Supported formats: PDF, DOC, DOCX (Max 5MB)
          </Typography>
        </Box>

        {uploading && <LinearProgress sx={{ mb: 2 }} />}

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!resume || uploading}
          fullWidth
          size="large"
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </Button>

        {uploadHistory.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Recent Uploads
            </Typography>
            <List>
              {uploadHistory.map((item) => (
                <ListItem
                  key={item.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteHistory(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={item.filename}
                    secondary={`Uploaded on ${item.date} at ${item.time}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box sx={{ mt: 3, p: 2, backgroundColor: "info.light", borderRadius: 1 }}>
          <Typography variant="body2" color="info.contrastText">
            <strong>Tip:</strong> Upload an updated resume to get the most
            accurate skill recommendations and job matches.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResumeUpload;