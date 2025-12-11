import React, { useState } from "react";
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
  MenuItem,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import api from "../api/api";
import ResumeUpload from "../components/ResumeUpload";

const EmployeeDashboard = () => {
  const [skills, setSkills] = useState([]);
  const [courses, setCourses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle analysis completion from ResumeUpload
  const handleAnalysisComplete = (data) => {
    setSkills(data.skills || []);
    setCourses(data.courses || []);
    setJobs(data.jobs || []);
  };

  // Filter courses
  const filteredCourses = filter === "all" ? courses : courses.filter((c) => c.type === filter);

  // Search for local jobs
  const handleJobSearch = async () => {
    if (!location) return;
    
    setLoading(true);
    setError("");
    
    try {
      // FIXED: Added trailing slash and proper query parameters
      const res = await api.get(`/jobs/search/?q=&location=${encodeURIComponent(location)}&radius=${radius}`);
      setJobs(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Error fetching jobs");
      console.error("Job search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Employee Dashboard
      </Typography>

      {/* Resume Upload Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />
      </Paper>

      {/* Skills Recommendation */}
      {skills.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recommended Skills to Improve
          </Typography>
          <List dense>
            {skills.map((skill, index) => (
              <ListItem key={index}>
                <ListItemText primary={skill} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Course Feed */}
      {courses.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recommended Courses
          </Typography>
          <TextField
            select
            label="Filter Courses"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ mb: 2, width: "200px" }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="free">Free</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
          </TextField>
          <Grid container spacing={2}>
            {filteredCourses.map((course, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {course.description}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Type: {course.type}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      href={course.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Course
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Hyper-local Job Recommendations */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Local Job Recommendations
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city or zip code"
            disabled={loading}
          />
          <TextField
            label="Radius (km)"
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            sx={{ width: "120px" }}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleJobSearch}
            disabled={!location || loading}
          >
            {loading ? <CircularProgress size={24} /> : "Search Jobs"}
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {jobs.map((job) => (
              <Grid item xs={12} md={6} key={job.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {job.company}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {job.location}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }} paragraph>
                      {job.description?.substring(0, 150)}...
                    </Typography>
                    {job.salary && (
                      <Typography variant="subtitle2">
                        Salary: ${job.salary}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => window.open(job.application_link || '#', '_blank')}
                    >
                      Apply Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            
            {jobs.length === 0 && location && !loading && (
              <Grid item xs={12}>
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  No jobs found in this area. Try expanding your search radius.
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default EmployeeDashboard;