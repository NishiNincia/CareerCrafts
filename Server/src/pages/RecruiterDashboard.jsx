import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import api from "../api/api";

const RecruiterDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    requirements: "",
    location: "",
    job_type: "full_time",
    salary: "",
    salary_type: "yearly",
    is_remote: false,
    application_link: ""
  });
  const [activeTab, setActiveTab] = useState(0);
  const [applicants, setApplicants] = useState({ high: [], medium: [], low: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Post a new job
  const handlePostJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // FIXED: Correct endpoint with trailing slash
      const res = await api.post("/jobs/create/", formData);
      setJobs([...jobs, res.data]);
      setFormData({
        title: "",
        company: "",
        description: "",
        requirements: "",
        location: "",
        job_type: "full_time",
        salary: "",
        salary_type: "yearly",
        is_remote: false,
        application_link: ""
      });
      setSuccess("Job posted successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Error posting job");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all posted jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // FIXED: Use the correct endpoint from your accounts views
        const res = await api.get("/accounts/my-jobs/");
        setJobs(res.data.jobs || []);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    };
    fetchJobs();
  }, []);

  // Fetch applicants by category
  const fetchApplicants = async (jobId) => {
    try {
      // FIXED: You'll need to implement this endpoint in Django
      const res = await api.get(`/accounts/job-applicants/${jobId}/`);
      setApplicants(res.data.applicants || { high: [], medium: [], low: [] });
    } catch (err) {
      setError(err.response?.data?.error || "Error fetching applicants");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Recruiter Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Job Posting Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Post a New Job</Typography>
        <Box component="form" onSubmit={handlePostJob}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements"
                name="requirements"
                multiline
                rows={2}
                value={formData.requirements}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Job Type"
                name="job_type"
                value={formData.job_type}
                onChange={handleInputChange}
              >
                <MenuItem value="full_time">Full Time</MenuItem>
                <MenuItem value="part_time">Part Time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="internship">Internship</MenuItem>
                <MenuItem value="remote">Remote</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Post Job"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Job Listings */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>My Job Postings</Typography>
        <Grid container spacing={2}>
          {jobs.map((job) => (
            <Grid item xs={12} md={6} key={job.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{job.title}</Typography>
                  <Typography color="text.secondary">{job.company}</Typography>
                  <Typography variant="body2">{job.location}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {job.description.substring(0, 100)}...
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => fetchApplicants(job.id)}>
                    View Applicants
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Applicant Categorization would go here */}
    </Container>
  );
};

export default RecruiterDashboard;